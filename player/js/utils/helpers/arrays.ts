function createRegularArray(type: "uint8c" | "float32", len: number) {
  let value: number;
  switch (type) {
    case "uint8c":
      value = 1;
      break;
    default:
      value = 1.1;
      break;
  }

  const arr: number[] = [];
  for (let i = 0; i < len; i += 1) arr.push(value);

  return arr;
}
function createTypedArrayFactory(type: "uint8c" | "float32", len: number) {
  if (type === "float32") return new Float32Array(len);

  return new Uint8ClampedArray(len);
}

export const createTypedArray =
  typeof Uint8ClampedArray === "function" && typeof Float32Array === "function"
    ? createTypedArrayFactory
    : createRegularArray;

export function createSizedArray(len: number) {
  return Array.from({ length: len });
}
