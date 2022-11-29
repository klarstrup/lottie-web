import { extendPrototype } from "../utils/functionExtensions";
import BaseElement from "./BaseElement";
import FrameElement from "./helpers/FrameElement";
import RenderableElement from "./helpers/RenderableElement";

function FootageElement(data, globalData, comp) {
  this.initFrame();
  this.initRenderable();
  this.assetData = globalData.getAssetData(data.refId);
  this.footageData = globalData.imageLoader.getAsset(this.assetData);
  this.initBaseData(data, globalData, comp);
}

FootageElement.prototype.prepareFrame = function () {};

extendPrototype([RenderableElement, BaseElement, FrameElement], FootageElement);

FootageElement.prototype.getBaseElement = function () {
  return null;
};

FootageElement.prototype.renderFrame = function () {};

FootageElement.prototype.destroy = function () {};

FootageElement.prototype.initExpressions = function () {};

FootageElement.prototype.getFootageData = function () {
  return this.footageData;
};

export default FootageElement;
