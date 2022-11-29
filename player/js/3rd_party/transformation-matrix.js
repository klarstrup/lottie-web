import { createTypedArray } from "../utils/helpers/arrays";

/*!
 Transformation Matrix v2.0
 (c) Epistemex 2014-2015
 www.epistemex.com
 By Ken Fyrstenberg
 Contributions by leeoniya.
 License: MIT, header required.
 */

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.
 *
 * All values are handled as floating point values.
 *
 * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
 * @prop {number} a - scale x
 * @prop {number} b - shear y
 * @prop {number} c - shear x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
 * @constructor
 */

const _cos = Math.cos;
const _sin = Math.sin;
const _tan = Math.tan;
const _rnd = Math.round;

function reset() {
  this.props[0] = 1;
  this.props[1] = 0;
  this.props[2] = 0;
  this.props[3] = 0;
  this.props[4] = 0;
  this.props[5] = 1;
  this.props[6] = 0;
  this.props[7] = 0;
  this.props[8] = 0;
  this.props[9] = 0;
  this.props[10] = 1;
  this.props[11] = 0;
  this.props[12] = 0;
  this.props[13] = 0;
  this.props[14] = 0;
  this.props[15] = 1;
  return this;
}

function rotate(angle) {
  if (angle === 0) {
    return this;
  }
  const mCos = _cos(angle);
  const mSin = _sin(angle);
  return this._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
}

function rotateX(angle) {
  if (angle === 0) {
    return this;
  }
  const mCos = _cos(angle);
  const mSin = _sin(angle);
  return this._t(1, 0, 0, 0, 0, mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1);
}

function rotateY(angle) {
  if (angle === 0) {
    return this;
  }
  const mCos = _cos(angle);
  const mSin = _sin(angle);
  return this._t(mCos, 0, mSin, 0, 0, 1, 0, 0, -mSin, 0, mCos, 0, 0, 0, 0, 1);
}

function rotateZ(angle) {
  if (angle === 0) {
    return this;
  }
  const mCos = _cos(angle);
  const mSin = _sin(angle);
  return this._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
}

function shear(sx, sy) {
  return this._t(1, sy, sx, 1, 0, 0);
}

function skew(ax, ay) {
  return this.shear(_tan(ax), _tan(ay));
}

function skewFromAxis(ax, angle) {
  const mCos = _cos(angle);
  const mSin = _sin(angle);
  return this._t(mCos, mSin, 0, 0, -mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    ._t(1, 0, 0, 0, _tan(ax), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    ._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  // return this._t(mCos, mSin, -mSin, mCos, 0, 0)._t(1, 0, _tan(ax), 1, 0, 0)._t(mCos, -mSin, mSin, mCos, 0, 0);
}

function scale(sx, sy, sz) {
  if (!sz && sz !== 0) {
    sz = 1;
  }
  if (sx === 1 && sy === 1 && sz === 1) {
    return this;
  }
  return this._t(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
}

function setTransform(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
  this.props[0] = a;
  this.props[1] = b;
  this.props[2] = c;
  this.props[3] = d;
  this.props[4] = e;
  this.props[5] = f;
  this.props[6] = g;
  this.props[7] = h;
  this.props[8] = i;
  this.props[9] = j;
  this.props[10] = k;
  this.props[11] = l;
  this.props[12] = m;
  this.props[13] = n;
  this.props[14] = o;
  this.props[15] = p;
  return this;
}

function translate(tx, ty, tz) {
  tz = tz || 0;
  if (tx !== 0 || ty !== 0 || tz !== 0) {
    return this._t(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
  }
  return this;
}

function transform(a2, b2, c2, d2, e2, f2, g2, h2, i2, j2, k2, l2, m2, n2, o2, p2) {
  const _p = this.props;

  if (
    a2 === 1 &&
    b2 === 0 &&
    c2 === 0 &&
    d2 === 0 &&
    e2 === 0 &&
    f2 === 1 &&
    g2 === 0 &&
    h2 === 0 &&
    i2 === 0 &&
    j2 === 0 &&
    k2 === 1 &&
    l2 === 0
  ) {
    // NOTE: commenting this condition because TurboFan deoptimizes code when present
    // if(m2 !== 0 || n2 !== 0 || o2 !== 0){
    _p[12] = _p[12] * a2 + _p[15] * m2;
    _p[13] = _p[13] * f2 + _p[15] * n2;
    _p[14] = _p[14] * k2 + _p[15] * o2;
    _p[15] *= p2;
    // }
    this._identityCalculated = false;
    return this;
  }

  const a1 = _p[0];
  const b1 = _p[1];
  const c1 = _p[2];
  const d1 = _p[3];
  const e1 = _p[4];
  const f1 = _p[5];
  const g1 = _p[6];
  const h1 = _p[7];
  const i1 = _p[8];
  const j1 = _p[9];
  const k1 = _p[10];
  const l1 = _p[11];
  const m1 = _p[12];
  const n1 = _p[13];
  const o1 = _p[14];
  const p1 = _p[15];

  /* matrix order (canvas compatible):
   * ace
   * bdf
   * 001
   */
  _p[0] = a1 * a2 + b1 * e2 + c1 * i2 + d1 * m2;
  _p[1] = a1 * b2 + b1 * f2 + c1 * j2 + d1 * n2;
  _p[2] = a1 * c2 + b1 * g2 + c1 * k2 + d1 * o2;
  _p[3] = a1 * d2 + b1 * h2 + c1 * l2 + d1 * p2;

  _p[4] = e1 * a2 + f1 * e2 + g1 * i2 + h1 * m2;
  _p[5] = e1 * b2 + f1 * f2 + g1 * j2 + h1 * n2;
  _p[6] = e1 * c2 + f1 * g2 + g1 * k2 + h1 * o2;
  _p[7] = e1 * d2 + f1 * h2 + g1 * l2 + h1 * p2;

  _p[8] = i1 * a2 + j1 * e2 + k1 * i2 + l1 * m2;
  _p[9] = i1 * b2 + j1 * f2 + k1 * j2 + l1 * n2;
  _p[10] = i1 * c2 + j1 * g2 + k1 * k2 + l1 * o2;
  _p[11] = i1 * d2 + j1 * h2 + k1 * l2 + l1 * p2;

  _p[12] = m1 * a2 + n1 * e2 + o1 * i2 + p1 * m2;
  _p[13] = m1 * b2 + n1 * f2 + o1 * j2 + p1 * n2;
  _p[14] = m1 * c2 + n1 * g2 + o1 * k2 + p1 * o2;
  _p[15] = m1 * d2 + n1 * h2 + o1 * l2 + p1 * p2;

  this._identityCalculated = false;
  return this;
}

function isIdentity() {
  if (!this._identityCalculated) {
    this._identity = !(
      this.props[0] !== 1 ||
      this.props[1] !== 0 ||
      this.props[2] !== 0 ||
      this.props[3] !== 0 ||
      this.props[4] !== 0 ||
      this.props[5] !== 1 ||
      this.props[6] !== 0 ||
      this.props[7] !== 0 ||
      this.props[8] !== 0 ||
      this.props[9] !== 0 ||
      this.props[10] !== 1 ||
      this.props[11] !== 0 ||
      this.props[12] !== 0 ||
      this.props[13] !== 0 ||
      this.props[14] !== 0 ||
      this.props[15] !== 1
    );
    this._identityCalculated = true;
  }
  return this._identity;
}

function equals(matr) {
  let i = 0;
  while (i < 16) {
    if (matr.props[i] !== this.props[i]) {
      return false;
    }
    i += 1;
  }
  return true;
}

function clone(matr) {
  for (let i = 0; i < 16; i += 1) matr.props[i] = this.props[i];

  return matr;
}

function cloneFromProps(props) {
  for (let i = 0; i < 16; i += 1) this.props[i] = props[i];
}

function applyToPoint(x, y, z) {
  return {
    x: x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],
    y: x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],
    z: x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14],
  };
  /* return {
         x: x * me.a + y * me.c + me.e,
         y: x * me.b + y * me.d + me.f
         }; */
}
function applyToX(x, y, z) {
  return x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12];
}
function applyToY(x, y, z) {
  return x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13];
}
function applyToZ(x, y, z) {
  return x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14];
}

function getInverseMatrix() {
  const determinant = this.props[0] * this.props[5] - this.props[1] * this.props[4];
  const a = this.props[5] / determinant;
  const b = -this.props[1] / determinant;
  const c = -this.props[4] / determinant;
  const d = this.props[0] / determinant;
  const e = (this.props[4] * this.props[13] - this.props[5] * this.props[12]) / determinant;
  const f = -(this.props[0] * this.props[13] - this.props[1] * this.props[12]) / determinant;
  const inverseMatrix = new Matrix();
  inverseMatrix.props[0] = a;
  inverseMatrix.props[1] = b;
  inverseMatrix.props[4] = c;
  inverseMatrix.props[5] = d;
  inverseMatrix.props[12] = e;
  inverseMatrix.props[13] = f;
  return inverseMatrix;
}

function inversePoint(pt) {
  const inverseMatrix = this.getInverseMatrix();
  return inverseMatrix.applyToPointArray(pt[0], pt[1], pt[2] || 0);
}

function inversePoints(pts) {
  return pts.map(pt => inversePoint(pt));
}

function applyToTriplePoints(pt1, pt2, pt3) {
  const arr = createTypedArray("float32", 6);
  if (this.isIdentity()) {
    arr[0] = pt1[0];
    arr[1] = pt1[1];
    arr[2] = pt2[0];
    arr[3] = pt2[1];
    arr[4] = pt3[0];
    arr[5] = pt3[1];
  } else {
    const p0 = this.props[0];
    const p1 = this.props[1];
    const p4 = this.props[4];
    const p5 = this.props[5];
    const p12 = this.props[12];
    const p13 = this.props[13];
    arr[0] = pt1[0] * p0 + pt1[1] * p4 + p12;
    arr[1] = pt1[0] * p1 + pt1[1] * p5 + p13;
    arr[2] = pt2[0] * p0 + pt2[1] * p4 + p12;
    arr[3] = pt2[0] * p1 + pt2[1] * p5 + p13;
    arr[4] = pt3[0] * p0 + pt3[1] * p4 + p12;
    arr[5] = pt3[0] * p1 + pt3[1] * p5 + p13;
  }
  return arr;
}

function applyToPointArray(x, y, z) {
  let arr;
  if (this.isIdentity()) {
    arr = [x, y, z];
  } else {
    arr = [
      x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],
      x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],
      x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14],
    ];
  }
  return arr;
}

function applyToPointStringified(x, y) {
  if (this.isIdentity()) return x + "," + y;

  const _p = this.props;
  return (
    Math.round((x * _p[0] + y * _p[4] + _p[12]) * 100) / 100 +
    "," +
    Math.round((x * _p[1] + y * _p[5] + _p[13]) * 100) / 100
  );
}

function toCSS() {
  // Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
  /* if(this.isIdentity()) {
            return '';
        } */
  let i = 0;
  const props = this.props;
  let cssValue = "matrix3d(";
  const v = 10000;
  while (i < 16) {
    cssValue += _rnd(props[i] * v) / v;
    cssValue += i === 15 ? ")" : ",";
    i += 1;
  }
  return cssValue;
}

function roundMatrixProperty(val) {
  const v = 10000;
  if ((val < 0.000001 && val > 0) || (val > -0.000001 && val < 0)) return _rnd(val * v) / v;

  return val;
}

function to2dCSS() {
  // Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
  /* if(this.isIdentity()) {
            return '';
        } */
  const props = this.props;
  const _a = roundMatrixProperty(props[0]);
  const _b = roundMatrixProperty(props[1]);
  const _c = roundMatrixProperty(props[4]);
  const _d = roundMatrixProperty(props[5]);
  const _e = roundMatrixProperty(props[12]);
  const _f = roundMatrixProperty(props[13]);
  return "matrix(" + _a + "," + _b + "," + _c + "," + _d + "," + _e + "," + _f + ")";
}

export default function Matrix() {
  this.reset = reset;
  this.rotate = rotate;
  this.rotateX = rotateX;
  this.rotateY = rotateY;
  this.rotateZ = rotateZ;
  this.skew = skew;
  this.skewFromAxis = skewFromAxis;
  this.shear = shear;
  this.scale = scale;
  this.setTransform = setTransform;
  this.translate = translate;
  this.transform = transform;
  this.applyToPoint = applyToPoint;
  this.applyToX = applyToX;
  this.applyToY = applyToY;
  this.applyToZ = applyToZ;
  this.applyToPointArray = applyToPointArray;
  this.applyToTriplePoints = applyToTriplePoints;
  this.applyToPointStringified = applyToPointStringified;
  this.toCSS = toCSS;
  this.to2dCSS = to2dCSS;
  this.clone = clone;
  this.cloneFromProps = cloneFromProps;
  this.equals = equals;
  this.inversePoints = inversePoints;
  this.inversePoint = inversePoint;
  this.getInverseMatrix = getInverseMatrix;
  this._t = this.transform;
  this.isIdentity = isIdentity;
  this._identity = true;
  this._identityCalculated = false;

  this.props = createTypedArray("float32", 16);
  this.reset();
}
