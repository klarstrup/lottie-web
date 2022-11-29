import ShapePath from "../shapes/ShapePath";
import pointPool from "./point_pool";
import poolFactory from "./pool_factory";

const shapePool = poolFactory(
  4,
  () => new ShapePath(),
  shapePath => {
    for (let i = 0; i < shapePath._length; i += 1) {
      pointPool.release(shapePath.v[i]);
      pointPool.release(shapePath.i[i]);
      pointPool.release(shapePath.o[i]);
      shapePath.v[i] = null;
      shapePath.i[i] = null;
      shapePath.o[i] = null;
    }
    shapePath._length = 0;
    shapePath.c = false;
  },
);
// @ts-expect-error
shapePool.clone = function clone(shape) {
  const cloned = shapePool.newElement();
  const len = shape._length === undefined ? shape.v.length : shape._length;
  cloned.setLength(len);
  cloned.c = shape.c;

  for (let i = 0; i < len; i += 1) {
    cloned.setTripleAt(
      shape.v[i][0],
      shape.v[i][1],
      shape.o[i][0],
      shape.o[i][1],
      shape.i[i][0],
      shape.i[i][1],
      i,
    );
  }
  return cloned;
};

export default shapePool;
