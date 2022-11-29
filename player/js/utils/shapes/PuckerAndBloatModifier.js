import { extendPrototype } from "../functionExtensions";
import shapePool from "../pooling/shape_pool";
import { getProp } from "../PropertyFactory";
import { ShapeModifier } from "./ShapeModifiers";

function PuckerAndBloatModifier() {}
extendPrototype([ShapeModifier], PuckerAndBloatModifier);
PuckerAndBloatModifier.prototype.initModifierProperties = function (elem, data) {
  this.getValue = this.processKeys;
  this.amount = getProp(elem, data.a, 0, null, this);
  this._isAnimated = Boolean(this.amount.effectsSequence.length);
};

PuckerAndBloatModifier.prototype.processPath = function (path, amount) {
  const percent = amount / 100;
  const centerPoint = [0, 0];
  const pathLength = path._length;
  for (let i = 0; i < pathLength; i += 1) {
    centerPoint[0] += path.v[i][0];
    centerPoint[1] += path.v[i][1];
  }
  centerPoint[0] /= pathLength;
  centerPoint[1] /= pathLength;
  const clonedPath = shapePool.newElement();
  clonedPath.c = path.c;
  let vX;
  let vY;
  let oX;
  let oY;
  let iX;
  let iY;
  for (let i = 0; i < pathLength; i += 1) {
    vX = path.v[i][0] + (centerPoint[0] - path.v[i][0]) * percent;
    vY = path.v[i][1] + (centerPoint[1] - path.v[i][1]) * percent;
    oX = path.o[i][0] + (centerPoint[0] - path.o[i][0]) * -percent;
    oY = path.o[i][1] + (centerPoint[1] - path.o[i][1]) * -percent;
    iX = path.i[i][0] + (centerPoint[0] - path.i[i][0]) * -percent;
    iY = path.i[i][1] + (centerPoint[1] - path.i[i][1]) * -percent;
    clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, i);
  }
  return clonedPath;
};

PuckerAndBloatModifier.prototype.processShapes = function (_isFirstFrame) {
  const amount = this.amount.v;

  if (amount !== 0) {
    for (const shapeData of this.shapes) {
      const localShapeCollection = shapeData.localShapeCollection;
      if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
        localShapeCollection.releaseShapes();
        shapeData.shape._mdf = true;
        const shapePaths = shapeData.shape.paths.shapes;
        const jLen = shapeData.shape.paths._length;
        for (let j = 0; j < jLen; j += 1) {
          localShapeCollection.addShape(this.processPath(shapePaths[j], amount));
        }
      }
      shapeData.shape.paths = shapeData.localShapeCollection;
    }
  }
  if (!this.dynamicProperties.length) this._mdf = false;
};

export default PuckerAndBloatModifier;
