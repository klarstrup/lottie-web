import { createTypedArray } from "../helpers/arrays";
import poolFactory from "./pool_factory";

export default poolFactory(8, () => createTypedArray("float32", 2));
