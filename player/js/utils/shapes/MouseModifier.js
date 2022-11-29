import { extendPrototype } from "../functionExtensions";
import { ShapeModifier, ShapeModifiers } from "./ShapeModifiers";

function MouseModifier() {}
extendPrototype([ShapeModifier], MouseModifier);
MouseModifier.prototype.processKeys = function (forceRender) {
  if (this.elem.globalData.frameId === this.frameId && !forceRender) {
    return;
  }
  this._mdf = true;
};

MouseModifier.prototype.addShapeToModifier = function () {
  this.positions.push([]);
};

MouseModifier.prototype.processPath = function (path, mouseCoords, positions) {
  const vValues = [];
  const oValues = [];
  const iValues = [];
  let theta;
  let x;
  let y;
  for (let i = 0; i < path.v.length; i += 1) {
    if (!positions.v[i]) {
      positions.v[i] = [path.v[i][0], path.v[i][1]];
      positions.o[i] = [path.o[i][0], path.o[i][1]];
      positions.i[i] = [path.i[i][0], path.i[i][1]];
      positions.distV[i] = 0;
      positions.distO[i] = 0;
      positions.distI[i] = 0;
    }
    theta = Math.atan2(path.v[i][1] - mouseCoords[1], path.v[i][0] - mouseCoords[0]);

    x = mouseCoords[0] - positions.v[i][0];
    y = mouseCoords[1] - positions.v[i][1];
    let distance = Math.sqrt(x * x + y * y);
    positions.distV[i] += (distance - positions.distV[i]) * this.data.dc;

    positions.v[i][0] =
      (Math.cos(theta) * Math.max(0, this.data.maxDist - positions.distV[i])) / 2 + path.v[i][0];
    positions.v[i][1] =
      (Math.sin(theta) * Math.max(0, this.data.maxDist - positions.distV[i])) / 2 + path.v[i][1];

    theta = Math.atan2(path.o[i][1] - mouseCoords[1], path.o[i][0] - mouseCoords[0]);

    x = mouseCoords[0] - positions.o[i][0];
    y = mouseCoords[1] - positions.o[i][1];
    distance = Math.sqrt(x * x + y * y);
    positions.distO[i] += (distance - positions.distO[i]) * this.data.dc;

    positions.o[i][0] =
      (Math.cos(theta) * Math.max(0, this.data.maxDist - positions.distO[i])) / 2 + path.o[i][0];
    positions.o[i][1] =
      (Math.sin(theta) * Math.max(0, this.data.maxDist - positions.distO[i])) / 2 + path.o[i][1];

    theta = Math.atan2(path.i[i][1] - mouseCoords[1], path.i[i][0] - mouseCoords[0]);

    x = mouseCoords[0] - positions.i[i][0];
    y = mouseCoords[1] - positions.i[i][1];
    distance = Math.sqrt(x * x + y * y);
    positions.distI[i] += (distance - positions.distI[i]) * this.data.dc;

    positions.i[i][0] =
      (Math.cos(theta) * Math.max(0, this.data.maxDist - positions.distI[i])) / 2 + path.i[i][0];
    positions.i[i][1] =
      (Math.sin(theta) * Math.max(0, this.data.maxDist - positions.distI[i])) / 2 + path.i[i][1];

    vValues.push(positions.v[i]);
    oValues.push(positions.o[i]);
    iValues.push(positions.i[i]);
  }

  return { v: vValues, o: oValues, i: iValues, c: path.c };
};

MouseModifier.prototype.processShapes = function () {
  const mouseX = this.elem.globalData.mouseX;
  const mouseY = this.elem.globalData.mouseY;

  if (mouseX) {
    const localMouseCoords = this.elem.globalToLocal([mouseX, mouseY, 0]);

    const newPaths = [];
    for (const shapeData of this.shapes) {
      if (!shapeData.shape._mdf && !this._mdf) {
        shapeData.shape.paths = shapeData.last;
      } else {
        shapeData.shape._mdf = true;
        const shapePaths = shapeData.shape.paths;
        for (let j = 0; j < shapePaths.length; j += 1) {
          if (!this.positions[i][j]) {
            this.positions[i][j] = { v: [], o: [], i: [], distV: [], distO: [], distI: [] };
          }
          newPaths.push(this.processPath(shapePaths[j], localMouseCoords, this.positions[i][j]));
        }
        shapeData.shape.paths = newPaths;
        shapeData.last = newPaths;
      }
    }
  }
};

MouseModifier.prototype.initModifierProperties = function (elem, data) {
  this.getValue = this.processKeys;
  this.data = data;
  this.positions = [];
};

ShapeModifiers.registerModifier("ms", MouseModifier);

export default MouseModifier;
