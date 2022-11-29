import SVGRendererBase from "../../renderers/SVGRendererBase"; // eslint-disable-line
import { extendPrototype } from "../../utils/functionExtensions";
import { createSizedArray } from "../../utils/helpers/arrays";
import { getProp } from "../../utils/PropertyFactory";
import ICompElement from "../CompElement";
import SVGBaseElement from "./SVGBaseElement";

function SVGCompElement(data, globalData, comp) {
  this.layers = data.layers;
  this.supports3d = true;
  this.completeLayers = false;
  this.pendingElements = [];
  this.elements = this.layers ? createSizedArray(this.layers.length) : [];
  this.initElement(data, globalData, comp);
  this.tm = data.tm
    ? getProp(this, data.tm, 0, globalData.frameRate, this)
    : { _placeholder: true };
}

extendPrototype([SVGRendererBase, ICompElement, SVGBaseElement], SVGCompElement);

SVGCompElement.prototype.createComp = function (data) {
  return new SVGCompElement(data, this.globalData, this);
};

export default SVGCompElement;
