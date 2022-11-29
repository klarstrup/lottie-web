import createNS from "./helpers/svg_elements";

export function createFilter(filId: string, skipCoordinates?: boolean) {
  const fil = createNS("filter");
  fil.setAttribute("id", filId);
  if (skipCoordinates !== true) {
    fil.setAttribute("filterUnits", "objectBoundingBox");
    fil.setAttribute("x", "0%");
    fil.setAttribute("y", "0%");
    fil.setAttribute("width", "100%");
    fil.setAttribute("height", "100%");
  }
  return fil;
}

export function createAlphaToLuminanceFilter() {
  const feColorMatrix = createNS("feColorMatrix");
  feColorMatrix.setAttribute("type", "matrix");
  feColorMatrix.setAttribute("color-interpolation-filters", "sRGB");
  feColorMatrix.setAttribute("values", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1");
  return feColorMatrix;
}
