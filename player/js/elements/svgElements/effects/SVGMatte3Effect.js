import { createElementID } from "../../../utils/common";
import createNS from "../../../utils/helpers/svg_elements";

const _svgMatteSymbols = [];

function SVGMatte3Effect(filterElem, filterManager, elem) {
  this.initialized = false;
  this.filterManager = filterManager;
  this.filterElem = filterElem;
  this.elem = elem;
  elem.matteElement = createNS("g");
  elem.matteElement.appendChild(elem.layerElement);
  elem.matteElement.appendChild(elem.transformedElement);
  elem.baseElement = elem.matteElement;
}

SVGMatte3Effect.prototype.findSymbol = function (mask) {
  let i = 0;
  const len = _svgMatteSymbols.length;
  while (i < len) {
    if (_svgMatteSymbols[i] === mask) {
      return _svgMatteSymbols[i];
    }
    i += 1;
  }
  return null;
};

SVGMatte3Effect.prototype.replaceInParent = function (mask, symbolId) {
  const parentNode = mask.layerElement.parentNode;
  if (!parentNode) {
    return;
  }
  const children = parentNode.children;
  let i = 0;
  const len = children.length;
  while (i < len) {
    if (children[i] === mask.layerElement) {
      break;
    }
    i += 1;
  }
  let nextChild;
  if (i <= len - 2) {
    nextChild = children[i + 1];
  }
  const useElem = createNS("use");
  useElem.setAttribute("href", "#" + symbolId);
  if (nextChild) {
    parentNode.insertBefore(useElem, nextChild);
  } else {
    parentNode.appendChild(useElem);
  }
};

SVGMatte3Effect.prototype.setElementAsMask = function (elem, mask) {
  if (!this.findSymbol(mask)) {
    const symbolId = createElementID();
    const masker = createNS("mask");
    masker.setAttribute("id", mask.layerId);
    masker.setAttribute("mask-type", "alpha");
    _svgMatteSymbols.push(mask);
    const defs = elem.globalData.defs;
    defs.appendChild(masker);
    const symbol = createNS("symbol");
    symbol.setAttribute("id", symbolId);
    this.replaceInParent(mask, symbolId);
    symbol.appendChild(mask.layerElement);
    defs.appendChild(symbol);
    const useElem = createNS("use");
    useElem.setAttribute("href", "#" + symbolId);
    masker.appendChild(useElem);
    mask.data.hd = false;
    mask.show();
  }
  elem.setMatte(mask.layerId);
};

SVGMatte3Effect.prototype.initialize = function () {
  const ind = this.filterManager.effectElements[0].p.v;
  const elements = this.elem.comp.elements;
  let i = 0;
  const len = elements.length;
  while (i < len) {
    if (elements[i] && elements[i].data.ind === ind) {
      this.setElementAsMask(this.elem, elements[i]);
    }
    i += 1;
  }
  this.initialized = true;
};

SVGMatte3Effect.prototype.renderFrame = function () {
  if (!this.initialized) this.initialize();
};

export default SVGMatte3Effect;
