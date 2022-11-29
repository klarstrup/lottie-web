import bezierLengthPool from "./bezier_length_pool";
import poolFactory from "./pool_factory";

export default poolFactory(
  8,
  () => ({ lengths: [], totalLength: 0 }),
  element => {
    for (const length of element.lengths) bezierLengthPool.release(length);

    element.lengths.length = 0;
  },
);
