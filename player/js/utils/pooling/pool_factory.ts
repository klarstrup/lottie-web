import { createSizedArray } from "../helpers/arrays";
import { double } from "./pooling";

export default function poolFactory(
  initialLength: number,
  _create: () => any,
  _release?: (element: any) => void,
) {
  let _length = 0;
  let _maxLength = initialLength;
  let pool = createSizedArray(_maxLength);

  return {
    newElement() {
      let element: any;
      if (_length) {
        _length -= 1;
        element = pool[_length];
      } else {
        element = _create();
      }
      return element;
    },
    release(element: any) {
      if (_length === _maxLength) {
        pool = double(pool);
        _maxLength *= 2;
      }
      _release?.(element);

      pool[_length] = element;
      _length += 1;
    },
    clone() {},
  };
}
