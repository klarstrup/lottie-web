import { createSizedArray } from "../helpers/arrays";
import ShapeCollection from "../shapes/ShapeCollection";
import { double } from "./pooling";
import shapePool from "./shape_pool";

let _length = 0;
let _maxLength = 4;
let pool = createSizedArray(_maxLength) as ShapeCollection[];
export function newShapeCollection() {
  let shapeCollection: ShapeCollection;
  if (_length) {
    _length -= 1;
    shapeCollection = pool[_length]!;
  } else {
    shapeCollection = new ShapeCollection();
  }
  return shapeCollection;
}

export function release(shapeCollection: ShapeCollection) {
  for (let i = 0; i < shapeCollection._length; i += 1) shapePool.release(shapeCollection.shapes[i]);

  shapeCollection._length = 0;

  if (_length === _maxLength) {
    pool = double(pool);
    _maxLength *= 2;
  }
  pool[_length] = shapeCollection;
  _length += 1;
}
