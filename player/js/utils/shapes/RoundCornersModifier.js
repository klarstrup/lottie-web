import { roundCorner } from "../common";
import { extendPrototype } from "../functionExtensions";
import shapePool from "../pooling/shape_pool";
import { getProp } from "../PropertyFactory";
import { ShapeModifier } from "./ShapeModifiers";

function RoundCornersModifier() {}
extendPrototype([ShapeModifier], RoundCornersModifier);
RoundCornersModifier.prototype.initModifierProperties = function (elem, data) {
  this.getValue = this.processKeys;
  this.rd = getProp(elem, data.r, 0, null, this);
  this._isAnimated = Boolean(this.rd.effectsSequence.length);
};

RoundCornersModifier.prototype.processPath = function (path, round) {
  const clonedPath = shapePool.newElement();
  clonedPath.c = path.c;
  const len = path._length;
  let index = 0;

  for (let i = 0; i < len; i += 1) {
    const currentV = path.v[i];
    const currentO = path.o[i];
    const currentI = path.i[i];
    if (
      currentV[0] === currentO[0] &&
      currentV[1] === currentO[1] &&
      currentV[0] === currentI[0] &&
      currentV[1] === currentI[1]
    ) {
      if ((i === 0 || i === len - 1) && !path.c) {
        clonedPath.setTripleAt(
          currentV[0],
          currentV[1],
          currentO[0],
          currentO[1],
          currentI[0],
          currentI[1],
          index,
        );

        index += 1;
      } else {
        let closerV = i === 0 ? path.v[len - 1] : path.v[i - 1];

        let distance = Math.sqrt(
          Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2),
        );
        let newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
        let iX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
        let vX = iX;
        let iY = currentV[1] - (currentV[1] - closerV[1]) * newPosPerc;
        let vY = iY;
        let oX = vX - (vX - currentV[0]) * roundCorner;
        let oY = vY - (vY - currentV[1]) * roundCorner;
        clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index);
        index += 1;

        closerV = i === len - 1 ? path.v[0] : path.v[i + 1];

        distance = Math.sqrt(
          Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2),
        );
        newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
        oX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
        vX = oX;
        oY = currentV[1] + (closerV[1] - currentV[1]) * newPosPerc;
        vY = oY;
        iX = vX - (vX - currentV[0]) * roundCorner;
        iY = vY - (vY - currentV[1]) * roundCorner;
        clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index);
        index += 1;
      }
    } else {
      clonedPath.setTripleAt(
        path.v[i][0],
        path.v[i][1],
        path.o[i][0],
        path.o[i][1],
        path.i[i][0],
        path.i[i][1],
        index,
      );
      index += 1;
    }
  }
  return clonedPath;
};

RoundCornersModifier.prototype.processShapes = function (_isFirstFrame) {
  const rd = this.rd.v;

  if (rd !== 0) {
    let localShapeCollection;
    for (const shapeData of this.shapes) {
      localShapeCollection = shapeData.localShapeCollection;
      if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
        localShapeCollection.releaseShapes();
        shapeData.shape._mdf = true;
        const shapePaths = shapeData.shape.paths.shapes;
        for (let j = 0; j < shapeData.shape.paths._length; j += 1) {
          localShapeCollection.addShape(this.processPath(shapePaths[j], rd));
        }
      }
      shapeData.shape.paths = shapeData.localShapeCollection;
    }
  }
  if (!this.dynamicProperties.length) this._mdf = false;
};

export default RoundCornersModifier;
