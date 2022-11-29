import { extendPrototype } from "../utils/functionExtensions";
import BaseElement from "./BaseElement";
import FrameElement from "./helpers/FrameElement";
import HierarchyElement from "./helpers/HierarchyElement";
import RenderableDOMElement from "./helpers/RenderableDOMElement";
import TransformElement from "./helpers/TransformElement";

function ICompElement() {}

extendPrototype(
  [BaseElement, TransformElement, HierarchyElement, FrameElement, RenderableDOMElement],
  ICompElement,
);

ICompElement.prototype.initElement = function (data, globalData, comp) {
  this.initFrame();
  this.initBaseData(data, globalData, comp);
  this.initTransform(data, globalData, comp);
  this.initRenderable();
  this.initHierarchy();
  this.initRendererElement();
  this.createContainerElements();
  this.createRenderableComponents();
  if (this.data.xt || !globalData.progressiveLoad) {
    this.buildAllItems();
  }
  this.hide();
};

/* ICompElement.prototype.hide = function(){
    if(!this.hidden){
        this.hideElement();
        var i,len = this.elements.length;
        for( i = 0; i < len; i+=1 ){
            if(this.elements[i]){
                this.elements[i].hide();
            }
        }
    }
}; */

ICompElement.prototype.prepareFrame = function (num) {
  this._mdf = false;
  this.prepareRenderableFrame(num);
  this.prepareProperties(num, this.isInRange);
  if (!this.isInRange && !this.data.xt) return;

  if (!this.tm._placeholder) {
    let timeRemapped = this.tm.v;
    if (timeRemapped === this.data.op) {
      timeRemapped = this.data.op - 1;
    }
    this.renderedFrame = timeRemapped;
  } else {
    this.renderedFrame = num / this.data.sr;
  }

  if (!this.completeLayers) this.checkLayers(this.renderedFrame);

  // This iteration needs to be backwards because of how expressions connect between each other
  const len = this.elements.length;
  for (let i = len - 1; i >= 0; i -= 1) {
    if (this.completeLayers || this.elements[i]) {
      this.elements[i].prepareFrame(this.renderedFrame - this.layers[i].st);
      if (this.elements[i]._mdf) this._mdf = true;
    }
  }
};

ICompElement.prototype.renderInnerContent = function () {
  for (let i = 0; i < this.layers.length; i += 1)
    if (this.completeLayers || this.elements[i]) this.elements[i]?.renderFrame();
};

ICompElement.prototype.setElements = function (elems) {
  this.elements = elems;
};

ICompElement.prototype.getElements = function () {
  return this.elements;
};

ICompElement.prototype.destroyElements = function () {
  for (let i = 0; i < this.layers.length; i += 1) this.elements[i]?.destroy();
};

ICompElement.prototype.destroy = function () {
  this.destroyElements();
  this.destroyBaseElement();
};

export default ICompElement;
