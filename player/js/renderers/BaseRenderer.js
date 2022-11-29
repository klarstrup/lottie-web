import FootageElement from "../elements/FootageElement";
import FontManager from "../utils/FontManager";

function BaseRenderer() {}
BaseRenderer.prototype.checkLayers = function (num) {
  let data;
  this.completeLayers = true;
  for (let i = this.layers.length - 1; i >= 0; i -= 1) {
    if (!this.elements[i]) {
      data = this.layers[i];
      if (
        data.ip - data.st <= num - this.layers[i].st &&
        data.op - data.st > num - this.layers[i].st
      ) {
        this.buildItem(i);
      }
    }
    this.completeLayers = this.elements[i] ? this.completeLayers : false;
  }
  this.checkPendingElements();
};

BaseRenderer.prototype.createItem = function (layer) {
  switch (layer.ty) {
    case 2:
      return this.createImage(layer);
    case 0:
      return this.createComp(layer);
    case 1:
      return this.createSolid(layer);
    case 3:
      return this.createNull(layer);
    case 4:
      return this.createShape(layer);
    case 5:
      return this.createText(layer);
    case 13:
      return this.createCamera(layer);
    case 15:
      return this.createFootage(layer);
    default:
      return this.createNull(layer);
  }
};

BaseRenderer.prototype.createCamera = function () {
  throw new Error("You're using a 3d camera. Try the html renderer.");
};

BaseRenderer.prototype.createFootage = function (data) {
  return new FootageElement(data, this.globalData, this);
};

BaseRenderer.prototype.buildAllItems = function () {
  for (let i = 0; i < this.layers.length; i += 1) this.buildItem(i);

  this.checkPendingElements();
};

BaseRenderer.prototype.includeLayers = function (newLayers) {
  this.completeLayers = false;

  for (let i = 0; i < newLayers.length; i += 1) {
    let j = 0;
    while (j < this.layers.length) {
      if (this.layers[j].id === newLayers[i].id) {
        this.layers[j] = newLayers[i];
        break;
      }
      j += 1;
    }
  }
};

BaseRenderer.prototype.initItems = function () {
  if (!this.globalData.progressiveLoad) this.buildAllItems();
};
BaseRenderer.prototype.buildElementParenting = function (element, parentName, hierarchy) {
  const elements = this.elements;
  const layers = this.layers;
  let i = 0;
  const len = layers.length;
  while (i < len) {
    if (layers[i].ind == parentName) {
      // eslint-disable-line eqeqeq
      if (!elements[i] || elements[i] === true) {
        this.buildItem(i);
        this.addPendingElement(element);
      } else {
        hierarchy.push(elements[i]);
        elements[i].setAsParent();
        if (layers[i].parent !== undefined) {
          this.buildElementParenting(element, layers[i].parent, hierarchy);
        } else {
          element.setHierarchy(hierarchy);
        }
      }
    }
    i += 1;
  }
};

BaseRenderer.prototype.addPendingElement = function (element) {
  this.pendingElements.push(element);
};

BaseRenderer.prototype.searchExtraCompositions = function (assets) {
  for (const asset of assets) if (asset.xt) this.createComp(asset);
};

BaseRenderer.prototype.getElementByPath = function (path) {
  const pathValue = path.shift();
  let element;
  if (typeof pathValue === "number") {
    element = this.elements[pathValue];
  } else {
    for (const thisElement of this.elements) {
      if (thisElement.data.nm === pathValue) {
        element = thisElement;
        break;
      }
    }
  }
  if (path.length === 0) return element;

  return element.getElementByPath(path);
};

BaseRenderer.prototype.setupGlobalData = function (animData, fontsContainer) {
  this.globalData.fontManager = new FontManager();
  this.globalData.fontManager.addChars(animData.chars);
  this.globalData.fontManager.addFonts(animData.fonts, fontsContainer);
  this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
  this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
  this.globalData.imageLoader = this.animationItem.imagePreloader;
  this.globalData.frameId = 0;
  this.globalData.frameRate = animData.fr;
  this.globalData.nm = animData.nm;
  this.globalData.compSize = { w: animData.w, h: animData.h };
};

export default BaseRenderer;
