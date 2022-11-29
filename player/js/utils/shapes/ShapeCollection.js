import { createSizedArray } from "../helpers/arrays";
import shapePool from "../pooling/shape_pool";

export default class ShapeCollection {
  _length = 0;
  _maxLength = 4;
  shapes = createSizedArray(this._maxLength);
  addShape(shapeData) {
    if (this._length === this._maxLength) {
      this.shapes = this.shapes.concat(createSizedArray(this._maxLength));
      this._maxLength *= 2;
    }
    this.shapes[this._length] = shapeData;
    this._length += 1;
  }
  releaseShapes() {
    for (let i = 0; i < this._length; i += 1) shapePool.release(this.shapes[i]);

    this._length = 0;
  }
}
