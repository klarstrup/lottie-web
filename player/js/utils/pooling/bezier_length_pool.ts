import { getDefaultCurveSegments } from "../common";
import { createTypedArray } from "../helpers/arrays";
import poolFactory from "./pool_factory";

export default poolFactory(8, () => ({
  addedLength: 0,
  percents: createTypedArray("float32", getDefaultCurveSegments()),
  lengths: createTypedArray("float32", getDefaultCurveSegments()),
}));
