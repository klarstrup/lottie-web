import { getBezierEasing } from "../../3rd_party/BezierEaser";
import { degToRads, roundCorner } from "../common";
import { extendPrototype } from "../functionExtensions";
import DynamicPropertyContainer from "../helpers/dynamicProperties";
import { newShapeCollection } from "../pooling/shapeCollection_pool";
import shapePool from "../pooling/shape_pool";
import { getProp } from "../PropertyFactory";

const initFrame = -999999;

function interpolateShape(frameNum, previousValue, caching) {
  let iterationIndex = caching.lastIndex;
  let keyPropS;
  let keyPropE;
  let isHold;
  let perc;
  let vertexValue;
  const kf = this.keyframes;
  if (frameNum < kf[0].t - this.offsetTime) {
    keyPropS = kf[0].s[0];
    isHold = true;
    iterationIndex = 0;
  } else if (frameNum >= kf[kf.length - 1].t - this.offsetTime) {
    keyPropS = kf[kf.length - 1].s ? kf[kf.length - 1].s[0] : kf[kf.length - 2].e[0];
    isHold = true;
  } else {
    let i = iterationIndex;
    const len = kf.length - 1;
    let flag = true;
    let keyData;
    let nextKeyData;
    while (flag) {
      keyData = kf[i];
      nextKeyData = kf[i + 1];
      if (nextKeyData.t - this.offsetTime > frameNum) break;

      if (i < len - 1) {
        i += 1;
      } else {
        flag = false;
      }
    }
    const keyframeMetadata = this.keyframesMetadata[i] || {};
    isHold = keyData.h === 1;
    iterationIndex = i;
    if (!isHold) {
      if (frameNum >= nextKeyData.t - this.offsetTime) {
        perc = 1;
      } else if (frameNum < keyData.t - this.offsetTime) {
        perc = 0;
      } else {
        let fnc;
        if (keyframeMetadata.__fnct) {
          fnc = keyframeMetadata.__fnct;
        } else {
          fnc = getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y).get;
          keyframeMetadata.__fnct = fnc;
        }
        perc = fnc(
          (frameNum - (keyData.t - this.offsetTime)) /
            (nextKeyData.t - this.offsetTime - (keyData.t - this.offsetTime)),
        );
      }
      keyPropE = nextKeyData.s ? nextKeyData.s[0] : keyData.e[0];
    }
    keyPropS = keyData.s[0];
  }

  caching.lastIndex = iterationIndex;

  for (let j = 0; j < previousValue._length; j += 1) {
    for (let k = 0; k < keyPropS.i[0].length; k += 1) {
      vertexValue = isHold
        ? keyPropS.i[j][k]
        : keyPropS.i[j][k] + (keyPropE.i[j][k] - keyPropS.i[j][k]) * perc;
      previousValue.i[j][k] = vertexValue;
      vertexValue = isHold
        ? keyPropS.o[j][k]
        : keyPropS.o[j][k] + (keyPropE.o[j][k] - keyPropS.o[j][k]) * perc;
      previousValue.o[j][k] = vertexValue;
      vertexValue = isHold
        ? keyPropS.v[j][k]
        : keyPropS.v[j][k] + (keyPropE.v[j][k] - keyPropS.v[j][k]) * perc;
      previousValue.v[j][k] = vertexValue;
    }
  }
}

function interpolateShapeCurrentTime() {
  const frameNum = this.comp.renderedFrame - this.offsetTime;
  const initTime = this.keyframes[0].t - this.offsetTime;
  const endTime = this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
  const lastFrame = this._caching.lastFrame;
  if (
    !(
      lastFrame !== initFrame &&
      ((lastFrame < initTime && frameNum < initTime) || (lastFrame > endTime && frameNum > endTime))
    )
  ) {
    /// /
    this._caching.lastIndex = lastFrame < frameNum ? this._caching.lastIndex : 0;
    this.interpolateShape(frameNum, this.pv, this._caching);
    /// /
  }
  this._caching.lastFrame = frameNum;
  return this.pv;
}

function resetShape() {
  this.paths = this.localShapeCollection;
}

function shapesEqual(shape1, shape2) {
  if (shape1._length !== shape2._length || shape1.c !== shape2.c) return false;

  for (let i = 0; i < shape1._length; i += 1) {
    if (
      shape1.v[i][0] !== shape2.v[i][0] ||
      shape1.v[i][1] !== shape2.v[i][1] ||
      shape1.o[i][0] !== shape2.o[i][0] ||
      shape1.o[i][1] !== shape2.o[i][1] ||
      shape1.i[i][0] !== shape2.i[i][0] ||
      shape1.i[i][1] !== shape2.i[i][1]
    ) {
      return false;
    }
  }

  return true;
}

function setVValue(newPath) {
  if (!shapesEqual(this.v, newPath)) {
    this.v = shapePool.clone(newPath);
    this.localShapeCollection.releaseShapes();
    this.localShapeCollection.addShape(this.v);
    this._mdf = true;
    this.paths = this.localShapeCollection;
  }
}

function processEffectsSequence() {
  if (this.elem.globalData.frameId === this.frameId) return;

  if (!this.effectsSequence.length) {
    this._mdf = false;
    return;
  }
  if (this.lock) {
    this.setVValue(this.pv);
    return;
  }
  this.lock = true;
  this._mdf = false;
  let finalValue;
  if (this.kf) {
    finalValue = this.pv;
  } else if (this.data.ks) {
    finalValue = this.data.ks.k;
  } else {
    finalValue = this.data.pt.k;
  }

  for (const sequence of this.effectsSequence) finalValue = sequence(finalValue);

  this.setVValue(finalValue);
  this.lock = false;
  this.frameId = this.elem.globalData.frameId;
}

function ShapeProperty(elem, data, type) {
  this.propType = "shape";
  this.comp = elem.comp;
  this.container = elem;
  this.elem = elem;
  this.data = data;
  this.k = false;
  this.kf = false;
  this._mdf = false;
  const pathData = type === 3 ? data.pt.k : data.ks.k;
  this.v = shapePool.clone(pathData);
  this.pv = shapePool.clone(this.v);
  this.localShapeCollection = newShapeCollection();
  this.paths = this.localShapeCollection;
  this.paths.addShape(this.v);
  this.reset = resetShape;
  this.effectsSequence = [];
}

function addEffect(effectFunction) {
  this.effectsSequence.push(effectFunction);
  this.container.addDynamicProperty(this);
}

ShapeProperty.prototype.interpolateShape = interpolateShape;
ShapeProperty.prototype.getValue = processEffectsSequence;
ShapeProperty.prototype.setVValue = setVValue;
ShapeProperty.prototype.addEffect = addEffect;

function KeyframedShapeProperty(elem, data, type) {
  this.propType = "shape";
  this.comp = elem.comp;
  this.elem = elem;
  this.container = elem;
  this.offsetTime = elem.data.st;
  this.keyframes = type === 3 ? data.pt.k : data.ks.k;
  this.keyframesMetadata = [];
  this.k = true;
  this.kf = true;
  const len = this.keyframes[0].s[0].i.length;
  this.v = shapePool.newElement();
  this.v.setPathData(this.keyframes[0].s[0].c, len);
  this.pv = shapePool.clone(this.v);
  this.localShapeCollection = newShapeCollection();
  this.paths = this.localShapeCollection;
  this.paths.addShape(this.v);
  this.lastFrame = initFrame;
  this.reset = resetShape;
  this._caching = { lastFrame: initFrame, lastIndex: 0 };
  this.effectsSequence = [interpolateShapeCurrentTime.bind(this)];
}
KeyframedShapeProperty.prototype.getValue = processEffectsSequence;
KeyframedShapeProperty.prototype.interpolateShape = interpolateShape;
KeyframedShapeProperty.prototype.setVValue = setVValue;
KeyframedShapeProperty.prototype.addEffect = addEffect;

function EllShapeProperty(elem, data) {
  this.v = shapePool.newElement();
  this.v.setPathData(true, 4);
  this.localShapeCollection = newShapeCollection();
  this.paths = this.localShapeCollection;
  this.localShapeCollection.addShape(this.v);
  this.d = data.d;
  this.elem = elem;
  this.comp = elem.comp;
  this.frameId = -1;
  this.initDynamicPropertyContainer(elem);
  this.p = getProp(elem, data.p, 1, 0, this);
  this.s = getProp(elem, data.s, 1, 0, this);
  if (this.dynamicProperties.length) {
    this.k = true;
  } else {
    this.k = false;
    this.convertEllToPath();
  }
}

EllShapeProperty.prototype = {
  reset: resetShape,
  getValue() {
    if (this.elem.globalData.frameId === this.frameId) {
      return;
    }
    this.frameId = this.elem.globalData.frameId;
    this.iterateDynamicProperties();

    if (this._mdf) {
      this.convertEllToPath();
    }
  },
  convertEllToPath() {
    const p0 = this.p.v[0];
    const p1 = this.p.v[1];
    const s0 = this.s.v[0] / 2;
    const s1 = this.s.v[1] / 2;
    const _cw = this.d !== 3;
    const _v = this.v;
    _v.v[0][0] = p0;
    _v.v[0][1] = p1 - s1;
    _v.v[1][0] = _cw ? p0 + s0 : p0 - s0;
    _v.v[1][1] = p1;
    _v.v[2][0] = p0;
    _v.v[2][1] = p1 + s1;
    _v.v[3][0] = _cw ? p0 - s0 : p0 + s0;
    _v.v[3][1] = p1;
    _v.i[0][0] = _cw ? p0 - s0 * roundCorner : p0 + s0 * roundCorner;
    _v.i[0][1] = p1 - s1;
    _v.i[1][0] = _cw ? p0 + s0 : p0 - s0;
    _v.i[1][1] = p1 - s1 * roundCorner;
    _v.i[2][0] = _cw ? p0 + s0 * roundCorner : p0 - s0 * roundCorner;
    _v.i[2][1] = p1 + s1;
    _v.i[3][0] = _cw ? p0 - s0 : p0 + s0;
    _v.i[3][1] = p1 + s1 * roundCorner;
    _v.o[0][0] = _cw ? p0 + s0 * roundCorner : p0 - s0 * roundCorner;
    _v.o[0][1] = p1 - s1;
    _v.o[1][0] = _cw ? p0 + s0 : p0 - s0;
    _v.o[1][1] = p1 + s1 * roundCorner;
    _v.o[2][0] = _cw ? p0 - s0 * roundCorner : p0 + s0 * roundCorner;
    _v.o[2][1] = p1 + s1;
    _v.o[3][0] = _cw ? p0 - s0 : p0 + s0;
    _v.o[3][1] = p1 - s1 * roundCorner;
  },
};

extendPrototype([DynamicPropertyContainer], EllShapeProperty);

function StarShapeProperty(elem, data) {
  this.v = shapePool.newElement();
  this.v.setPathData(true, 0);
  this.elem = elem;
  this.comp = elem.comp;
  this.data = data;
  this.frameId = -1;
  this.d = data.d;
  this.initDynamicPropertyContainer(elem);
  if (data.sy === 1) {
    this.ir = getProp(elem, data.ir, 0, 0, this);
    this.is = getProp(elem, data.is, 0, 0.01, this);
    this.convertToPath = this.convertStarToPath;
  } else {
    this.convertToPath = this.convertPolygonToPath;
  }
  this.pt = getProp(elem, data.pt, 0, 0, this);
  this.p = getProp(elem, data.p, 1, 0, this);
  this.r = getProp(elem, data.r, 0, degToRads, this);
  this.or = getProp(elem, data.or, 0, 0, this);
  this.os = getProp(elem, data.os, 0, 0.01, this);
  this.localShapeCollection = newShapeCollection();
  this.localShapeCollection.addShape(this.v);
  this.paths = this.localShapeCollection;
  if (this.dynamicProperties.length) {
    this.k = true;
  } else {
    this.k = false;
    this.convertToPath();
  }
}

StarShapeProperty.prototype = {
  reset: resetShape,
  getValue() {
    if (this.elem.globalData.frameId === this.frameId) return;

    this.frameId = this.elem.globalData.frameId;
    this.iterateDynamicProperties();
    if (this._mdf) {
      this.convertToPath();
    }
  },
  convertStarToPath() {
    const numPts = Math.floor(this.pt.v) * 2;
    const angle = (Math.PI * 2) / numPts;
    let longFlag = true;
    const longRad = this.or.v;
    const shortRad = this.ir.v;
    const longRound = this.os.v;
    const shortRound = this.is.v;
    const longPerimSegment = (2 * Math.PI * longRad) / (numPts * 2);
    const shortPerimSegment = (2 * Math.PI * shortRad) / (numPts * 2);
    let currentAng = -Math.PI / 2;
    currentAng += this.r.v;
    const dir = this.data.d === 3 ? -1 : 1;
    this.v._length = 0;
    for (let i = 0; i < numPts; i += 1) {
      const rad = longFlag ? longRad : shortRad;
      const roundness = longFlag ? longRound : shortRound;
      const perimSegment = longFlag ? longPerimSegment : shortPerimSegment;
      let x = rad * Math.cos(currentAng);
      let y = rad * Math.sin(currentAng);
      const ox = x === 0 && y === 0 ? 0 : y / Math.sqrt(x * x + y * y);
      const oy = x === 0 && y === 0 ? 0 : -x / Math.sqrt(x * x + y * y);
      x += +this.p.v[0];
      y += +this.p.v[1];
      this.v.setTripleAt(
        x,
        y,
        x - ox * perimSegment * roundness * dir,
        y - oy * perimSegment * roundness * dir,
        x + ox * perimSegment * roundness * dir,
        y + oy * perimSegment * roundness * dir,
        i,
        true,
      );

      longFlag = !longFlag;
      currentAng += angle * dir;
    }
  },
  convertPolygonToPath() {
    const numPts = Math.floor(this.pt.v);
    const angle = (Math.PI * 2) / numPts;
    const rad = this.or.v;
    const roundness = this.os.v;
    const perimSegment = (2 * Math.PI * rad) / (numPts * 4);
    let currentAng = -Math.PI * 0.5;
    const dir = this.data.d === 3 ? -1 : 1;
    currentAng += this.r.v;
    this.v._length = 0;
    for (let i = 0; i < numPts; i += 1) {
      let x = rad * Math.cos(currentAng);
      let y = rad * Math.sin(currentAng);
      const ox = x === 0 && y === 0 ? 0 : y / Math.sqrt(x * x + y * y);
      const oy = x === 0 && y === 0 ? 0 : -x / Math.sqrt(x * x + y * y);
      x += +this.p.v[0];
      y += +this.p.v[1];
      this.v.setTripleAt(
        x,
        y,
        x - ox * perimSegment * roundness * dir,
        y - oy * perimSegment * roundness * dir,
        x + ox * perimSegment * roundness * dir,
        y + oy * perimSegment * roundness * dir,
        i,
        true,
      );
      currentAng += angle * dir;
    }
    this.paths.length = 0;
    this.paths[0] = this.v;
  },
};
extendPrototype([DynamicPropertyContainer], StarShapeProperty);

function RectShapeProperty(elem, data) {
  this.v = shapePool.newElement();
  this.v.c = true;
  this.localShapeCollection = newShapeCollection();
  this.localShapeCollection.addShape(this.v);
  this.paths = this.localShapeCollection;
  this.elem = elem;
  this.comp = elem.comp;
  this.frameId = -1;
  this.d = data.d;
  this.initDynamicPropertyContainer(elem);
  this.p = getProp(elem, data.p, 1, 0, this);
  this.s = getProp(elem, data.s, 1, 0, this);
  this.r = getProp(elem, data.r, 0, 0, this);
  if (this.dynamicProperties.length) {
    this.k = true;
  } else {
    this.k = false;
    this.convertRectToPath();
  }
}

RectShapeProperty.prototype = {
  convertRectToPath() {
    const p0 = this.p.v[0];
    const p1 = this.p.v[1];
    const v0 = this.s.v[0] / 2;
    const v1 = this.s.v[1] / 2;
    const round = Math.min(v0, v1, this.r.v);
    const cPoint = round * (1 - roundCorner);
    this.v._length = 0;

    if (this.d === 2 || this.d === 1) {
      this.v.setTripleAt(
        p0 + v0,
        p1 - v1 + round,
        p0 + v0,
        p1 - v1 + round,
        p0 + v0,
        p1 - v1 + cPoint,
        0,
        true,
      );
      this.v.setTripleAt(
        p0 + v0,
        p1 + v1 - round,
        p0 + v0,
        p1 + v1 - cPoint,
        p0 + v0,
        p1 + v1 - round,
        1,
        true,
      );
      if (round !== 0) {
        this.v.setTripleAt(
          p0 + v0 - round,
          p1 + v1,
          p0 + v0 - round,
          p1 + v1,
          p0 + v0 - cPoint,
          p1 + v1,
          2,
          true,
        );
        this.v.setTripleAt(
          p0 - v0 + round,
          p1 + v1,
          p0 - v0 + cPoint,
          p1 + v1,
          p0 - v0 + round,
          p1 + v1,
          3,
          true,
        );
        this.v.setTripleAt(
          p0 - v0,
          p1 + v1 - round,
          p0 - v0,
          p1 + v1 - round,
          p0 - v0,
          p1 + v1 - cPoint,
          4,
          true,
        );
        this.v.setTripleAt(
          p0 - v0,
          p1 - v1 + round,
          p0 - v0,
          p1 - v1 + cPoint,
          p0 - v0,
          p1 - v1 + round,
          5,
          true,
        );
        this.v.setTripleAt(
          p0 - v0 + round,
          p1 - v1,
          p0 - v0 + round,
          p1 - v1,
          p0 - v0 + cPoint,
          p1 - v1,
          6,
          true,
        );
        this.v.setTripleAt(
          p0 + v0 - round,
          p1 - v1,
          p0 + v0 - cPoint,
          p1 - v1,
          p0 + v0 - round,
          p1 - v1,
          7,
          true,
        );
      } else {
        this.v.setTripleAt(p0 - v0, p1 + v1, p0 - v0 + cPoint, p1 + v1, p0 - v0, p1 + v1, 2);
        this.v.setTripleAt(p0 - v0, p1 - v1, p0 - v0, p1 - v1 + cPoint, p0 - v0, p1 - v1, 3);
      }
    } else {
      this.v.setTripleAt(
        p0 + v0,
        p1 - v1 + round,
        p0 + v0,
        p1 - v1 + cPoint,
        p0 + v0,
        p1 - v1 + round,
        0,
        true,
      );
      if (round !== 0) {
        this.v.setTripleAt(
          p0 + v0 - round,
          p1 - v1,
          p0 + v0 - round,
          p1 - v1,
          p0 + v0 - cPoint,
          p1 - v1,
          1,
          true,
        );
        this.v.setTripleAt(
          p0 - v0 + round,
          p1 - v1,
          p0 - v0 + cPoint,
          p1 - v1,
          p0 - v0 + round,
          p1 - v1,
          2,
          true,
        );
        this.v.setTripleAt(
          p0 - v0,
          p1 - v1 + round,
          p0 - v0,
          p1 - v1 + round,
          p0 - v0,
          p1 - v1 + cPoint,
          3,
          true,
        );
        this.v.setTripleAt(
          p0 - v0,
          p1 + v1 - round,
          p0 - v0,
          p1 + v1 - cPoint,
          p0 - v0,
          p1 + v1 - round,
          4,
          true,
        );
        this.v.setTripleAt(
          p0 - v0 + round,
          p1 + v1,
          p0 - v0 + round,
          p1 + v1,
          p0 - v0 + cPoint,
          p1 + v1,
          5,
          true,
        );
        this.v.setTripleAt(
          p0 + v0 - round,
          p1 + v1,
          p0 + v0 - cPoint,
          p1 + v1,
          p0 + v0 - round,
          p1 + v1,
          6,
          true,
        );
        this.v.setTripleAt(
          p0 + v0,
          p1 + v1 - round,
          p0 + v0,
          p1 + v1 - round,
          p0 + v0,
          p1 + v1 - cPoint,
          7,
          true,
        );
      } else {
        this.v.setTripleAt(p0 - v0, p1 - v1, p0 - v0 + cPoint, p1 - v1, p0 - v0, p1 - v1, 1, true);
        this.v.setTripleAt(p0 - v0, p1 + v1, p0 - v0, p1 + v1 - cPoint, p0 - v0, p1 + v1, 2, true);
        this.v.setTripleAt(p0 + v0, p1 + v1, p0 + v0 - cPoint, p1 + v1, p0 + v0, p1 + v1, 3, true);
      }
    }
  },
  getValue() {
    if (this.elem.globalData.frameId === this.frameId) return;

    this.frameId = this.elem.globalData.frameId;
    this.iterateDynamicProperties();
    if (this._mdf) this.convertRectToPath();
  },
  reset: resetShape,
};
extendPrototype([DynamicPropertyContainer], RectShapeProperty);

export function getShapeProp(elem, data, type) {
  let prop;
  if (type === 3 || type === 4) {
    const dataProp = type === 3 ? data.pt : data.ks;
    const keys = dataProp.k;
    if (keys.length) {
      prop = new KeyframedShapeProperty(elem, data, type);
    } else {
      prop = new ShapeProperty(elem, data, type);
    }
  } else if (type === 5) {
    prop = new RectShapeProperty(elem, data);
  } else if (type === 6) {
    prop = new EllShapeProperty(elem, data);
  } else if (type === 7) {
    prop = new StarShapeProperty(elem, data);
  }
  if (prop.k) elem.addDynamicProperty(prop);

  return prop;
}

export function getConstructorFunction() {
  return ShapeProperty;
}

export function getKeyframedConstructorFunction() {
  return KeyframedShapeProperty;
}
