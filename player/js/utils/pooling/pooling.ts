import { createSizedArray } from "../helpers/arrays";

export const double = (arr: any[]) => arr.concat(createSizedArray(arr.length));
