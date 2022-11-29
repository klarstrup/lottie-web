import ShapePropertyFactory from "../../../utils/shapes/ShapeProperty";
import SVGShapeData from "./SVGShapeData";

function CVShapeData(element, data, styles, transformsManager) {
  this.styledShapes = [];
  this.tr = [0, 0, 0, 0, 0, 0];
  let ty = 4;
  if (data.ty === "rc") {
    ty = 5;
  } else if (data.ty === "el") {
    ty = 6;
  } else if (data.ty === "sr") {
    ty = 7;
  }
  this.sh = ShapePropertyFactory.getShapeProp(element, data, ty, element);

  for (const style of styles) {
    if (style.closed) continue;
    const styledShape = {
      transforms: transformsManager.addTransformSequence(style.transforms),
      trNodes: [],
    };
    this.styledShapes.push(styledShape);
    style.elements.push(styledShape);
  }
}

CVShapeData.prototype.setAsAnimated = SVGShapeData.prototype.setAsAnimated;

export default CVShapeData;
