import createNS from "../../../utils/helpers/svg_elements";

function SVGTritoneFilter(filter, filterManager, elem, id) {
  this.filterManager = filterManager;
  const feColorMatrix = createNS("feColorMatrix");
  feColorMatrix.setAttribute("type", "matrix");
  feColorMatrix.setAttribute("color-interpolation-filters", "linearRGB");
  feColorMatrix.setAttribute(
    "values",
    "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0",
  );
  filter.appendChild(feColorMatrix);
  const feComponentTransfer = createNS("feComponentTransfer");
  feComponentTransfer.setAttribute("color-interpolation-filters", "sRGB");
  feComponentTransfer.setAttribute("result", id);
  this.matrixFilter = feComponentTransfer;
  const feFuncR = createNS("feFuncR");
  feFuncR.setAttribute("type", "table");
  feComponentTransfer.appendChild(feFuncR);
  this.feFuncR = feFuncR;
  const feFuncG = createNS("feFuncG");
  feFuncG.setAttribute("type", "table");
  feComponentTransfer.appendChild(feFuncG);
  this.feFuncG = feFuncG;
  const feFuncB = createNS("feFuncB");
  feFuncB.setAttribute("type", "table");
  feComponentTransfer.appendChild(feFuncB);
  this.feFuncB = feFuncB;
  filter.appendChild(feComponentTransfer);
}

SVGTritoneFilter.prototype.renderFrame = function (forceRender) {
  if (forceRender || this.filterManager._mdf) {
    const color1 = this.filterManager.effectElements[0].p.v;
    const color2 = this.filterManager.effectElements[1].p.v;
    const color3 = this.filterManager.effectElements[2].p.v;
    const tableR = color3[0] + " " + color2[0] + " " + color1[0];
    const tableG = color3[1] + " " + color2[1] + " " + color1[1];
    const tableB = color3[2] + " " + color2[2] + " " + color1[2];
    this.feFuncR.setAttribute("tableValues", tableR);
    this.feFuncG.setAttribute("tableValues", tableG);
    this.feFuncB.setAttribute("tableValues", tableB);
  }
};

export default SVGTritoneFilter;
