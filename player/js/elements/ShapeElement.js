import ProcessedElement from "./helpers/shapes/ProcessedElement";

function IShapeElement() {}

IShapeElement.prototype = {
  addShapeToModifiers(data) {
    for (const shapeModifier of this.shapeModifiers) shapeModifier.addShape(data);
  },
  isShapeInAnimatedModifiers(data) {
    for (const shapeModifier of this.shapeModifiers)
      if (shapeModifier.isAnimatedWithShape(data)) return true;

    return false;
  },
  renderModifiers() {
    const len = this.shapeModifiers.length;
    if (!len) return;

    for (const shape of this.shapes) shape.sh.reset();

    let shouldBreakProcess;
    for (let i = len - 1; i >= 0; i -= 1) {
      shouldBreakProcess = this.shapeModifiers[i].processShapes(this._isFirstFrame);
      // workaround to fix cases where a repeater resets the shape so the following processes get called twice
      // TODO: find a better solution for this
      if (shouldBreakProcess) break;
    }
  },

  searchProcessedElement(elem) {
    for (const element of this.processedElements) if (element.elem === elem) return element.pos;

    return 0;
  },
  addProcessedElement(elem, pos) {
    const elements = this.processedElements;
    let i = elements.length;
    while (i) {
      i -= 1;
      if (elements[i].elem === elem) {
        elements[i].pos = pos;
        return;
      }
    }
    elements.push(new ProcessedElement(elem, pos));
  },
  prepareFrame(num) {
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
  },
};

export default IShapeElement;
