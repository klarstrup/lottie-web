import Matrix from "../../3rd_party/transformation-matrix";
import { extendPrototype } from "../../utils/functionExtensions";
import getBlendMode from "../../utils/helpers/blendModes";
import { lineCapEnum, lineJoinEnum } from "../../utils/helpers/shapeEnums";
import { ShapeModifiers } from "../../utils/shapes/ShapeModifiers";
import { getShapeProp } from "../../utils/shapes/ShapeProperty";
import { getTransformProperty } from "../../utils/TransformProperty";
import BaseElement from "../BaseElement";
import FrameElement from "../helpers/FrameElement";
import HierarchyElement from "../helpers/HierarchyElement";
import RenderableDOMElement from "../helpers/RenderableDOMElement";
import ShapeGroupData from "../helpers/shapes/ShapeGroupData";
import { createRenderFunction } from "../helpers/shapes/SVGElementsRenderer";
import SVGFillStyleData from "../helpers/shapes/SVGFillStyleData";
import SVGGradientFillStyleData from "../helpers/shapes/SVGGradientFillStyleData";
import SVGGradientStrokeStyleData from "../helpers/shapes/SVGGradientStrokeStyleData";
import SVGNoStyleData from "../helpers/shapes/SVGNoStyleData";
import SVGShapeData from "../helpers/shapes/SVGShapeData";
import SVGStrokeStyleData from "../helpers/shapes/SVGStrokeStyleData";
import SVGStyleData from "../helpers/shapes/SVGStyleData";
import SVGTransformData from "../helpers/shapes/SVGTransformData";
import TransformElement from "../helpers/TransformElement";
import IShapeElement from "../ShapeElement";
import SVGBaseElement from "./SVGBaseElement";

function SVGShapeElement(data, globalData, comp) {
  // List of drawable elements
  this.shapes = [];
  // Full shape data
  this.shapesData = data.shapes;
  // List of styles that will be applied to shapes
  this.stylesList = [];
  // List of modifiers that will be applied to shapes
  this.shapeModifiers = [];
  // List of items in shape tree
  this.itemsData = [];
  // List of items in previous shape tree
  this.processedElements = [];
  // List of animated components
  this.animatedContents = [];
  this.initElement(data, globalData, comp);
  // Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
  // List of elements that have been created
  this.prevViewData = [];
  // Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
}

extendPrototype(
  [
    BaseElement,
    TransformElement,
    SVGBaseElement,
    IShapeElement,
    HierarchyElement,
    FrameElement,
    RenderableDOMElement,
  ],
  SVGShapeElement,
);

SVGShapeElement.prototype.initSecondaryElement = function () {};

SVGShapeElement.prototype.identityMatrix = new Matrix();

SVGShapeElement.prototype.buildExpressionInterface = function () {};

SVGShapeElement.prototype.createContent = function () {
  this.searchShapes(
    this.shapesData,
    this.itemsData,
    this.prevViewData,
    this.layerElement,
    0,
    [],
    true,
  );
  this.filterUniqueShapes();
};

/*
This method searches for multiple shapes that affect a single element and one of them is animated
*/
SVGShapeElement.prototype.filterUniqueShapes = function () {
  let areAnimated = false;
  for (const style of this.stylesList) {
    areAnimated = false;
    const tempShapes = [];
    for (const shape of this.shapes) {
      if (shape.styles.includes(style)) {
        tempShapes.push(shape);
        areAnimated = shape._isAnimated || areAnimated;
      }
    }
    if (tempShapes.length > 1 && areAnimated) this.setShapesAsAnimated(tempShapes);
  }
};

SVGShapeElement.prototype.setShapesAsAnimated = function (shapes) {
  for (const shape of shapes) shape.setAsAnimated();
};

SVGShapeElement.prototype.createStyleElement = function (data, level) {
  // TODO: prevent drawing of hidden styles
  let elementData;
  const styleOb = new SVGStyleData(data, level);

  const pathElement = styleOb.pElem;
  if (data.ty === "st") {
    elementData = new SVGStrokeStyleData(this, data, styleOb);
  } else if (data.ty === "fl") {
    elementData = new SVGFillStyleData(this, data, styleOb);
  } else if (data.ty === "gf" || data.ty === "gs") {
    const GradientConstructor =
      data.ty === "gf" ? SVGGradientFillStyleData : SVGGradientStrokeStyleData;
    elementData = new GradientConstructor(this, data, styleOb);
    this.globalData.defs.appendChild(elementData.gf);
    if (elementData.maskId) {
      this.globalData.defs.appendChild(elementData.ms);
      this.globalData.defs.appendChild(elementData.of);
      pathElement.setAttribute("mask", "url(#" + elementData.maskId + ")");
    }
  } else if (data.ty === "no") {
    elementData = new SVGNoStyleData(this, data, styleOb);
  }

  if (data.ty === "st" || data.ty === "gs") {
    pathElement.setAttribute("stroke-linecap", lineCapEnum[data.lc || 2]);
    pathElement.setAttribute("stroke-linejoin", lineJoinEnum[data.lj || 2]);
    pathElement.setAttribute("fill-opacity", "0");
    if (data.lj === 1) {
      pathElement.setAttribute("stroke-miterlimit", data.ml);
    }
  }

  if (data.r === 2) {
    pathElement.setAttribute("fill-rule", "evenodd");
  }

  if (data.ln) {
    pathElement.setAttribute("id", data.ln);
  }
  if (data.cl) {
    pathElement.setAttribute("class", data.cl);
  }
  if (data.bm) {
    pathElement.style["mix-blend-mode"] = getBlendMode(data.bm);
  }
  this.stylesList.push(styleOb);
  this.addToAnimatedContents(data, elementData);
  return elementData;
};

SVGShapeElement.prototype.createGroupElement = function (data) {
  const elementData = new ShapeGroupData();
  if (data.ln) {
    elementData.gr.setAttribute("id", data.ln);
  }
  if (data.cl) {
    elementData.gr.setAttribute("class", data.cl);
  }
  if (data.bm) {
    elementData.gr.style["mix-blend-mode"] = getBlendMode(data.bm);
  }
  return elementData;
};

SVGShapeElement.prototype.createTransformElement = function (data, container) {
  const transformProperty = getTransformProperty(this, data, this);
  const elementData = new SVGTransformData(transformProperty, transformProperty.o, container);
  this.addToAnimatedContents(data, elementData);
  return elementData;
};

SVGShapeElement.prototype.createShapeElement = function (data, ownTransformers, level) {
  let ty = 4;
  if (data.ty === "rc") {
    ty = 5;
  } else if (data.ty === "el") {
    ty = 6;
  } else if (data.ty === "sr") {
    ty = 7;
  }
  const shapeProperty = getShapeProp(this, data, ty, this);
  const elementData = new SVGShapeData(ownTransformers, level, shapeProperty);
  this.shapes.push(elementData);
  this.addShapeToModifiers(elementData);
  this.addToAnimatedContents(data, elementData);
  return elementData;
};

SVGShapeElement.prototype.addToAnimatedContents = function (data, element) {
  let i = 0;
  const len = this.animatedContents.length;
  while (i < len) {
    if (this.animatedContents[i].element === element) return;

    i += 1;
  }
  this.animatedContents.push({ fn: createRenderFunction(data), element, data });
};

SVGShapeElement.prototype.setElementStyles = function (elementData) {
  const arr = elementData.styles;
  for (const style of this.stylesList) if (!style.closed) arr.push(style);
};

SVGShapeElement.prototype.reloadShapes = function () {
  this._isFirstFrame = true;

  for (let i = 0; i < this.itemsData.length; i += 1) this.prevViewData[i] = this.itemsData[i];

  this.searchShapes(
    this.shapesData,
    this.itemsData,
    this.prevViewData,
    this.layerElement,
    0,
    [],
    true,
  );
  this.filterUniqueShapes();
  for (let i = 0; i < this.dynamicProperties.length; i += 1) this.dynamicProperties[i].getValue();

  this.renderModifiers();
};

SVGShapeElement.prototype.searchShapes = function (
  arr,
  itemsData,
  prevViewData,
  container,
  level,
  transformers,
  render,
) {
  const ownTransformers = [...transformers];
  const ownStyles = [];
  const ownModifiers = [];
  let currentTransform;
  let modifier;
  let processedPos;
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    processedPos = this.searchProcessedElement(arr[i]);
    if (!processedPos) {
      arr[i]._render = render;
    } else {
      itemsData[i] = prevViewData[processedPos - 1];
    }
    if (
      arr[i].ty === "fl" ||
      arr[i].ty === "st" ||
      arr[i].ty === "gf" ||
      arr[i].ty === "gs" ||
      arr[i].ty === "no"
    ) {
      if (!processedPos) {
        itemsData[i] = this.createStyleElement(arr[i], level);
      } else {
        itemsData[i].style.closed = false;
      }
      if (arr[i]._render && itemsData[i].style.pElem.parentNode !== container)
        container.appendChild(itemsData[i].style.pElem);

      ownStyles.push(itemsData[i].style);
    } else if (arr[i].ty === "gr") {
      if (!processedPos) {
        itemsData[i] = this.createGroupElement(arr[i]);
      } else {
        for (let j = 0; j < itemsData[i].it.length; j += 1)
          itemsData[i].prevViewData[j] = itemsData[i].it[j];
      }
      this.searchShapes(
        arr[i].it,
        itemsData[i].it,
        itemsData[i].prevViewData,
        itemsData[i].gr,
        level + 1,
        ownTransformers,
        render,
      );
      if (arr[i]._render && itemsData[i].gr.parentNode !== container) {
        container.appendChild(itemsData[i].gr);
      }
    } else if (arr[i].ty === "tr") {
      if (!processedPos) itemsData[i] = this.createTransformElement(arr[i], container);

      currentTransform = itemsData[i].transform;
      ownTransformers.push(currentTransform);
    } else if (
      arr[i].ty === "sh" ||
      arr[i].ty === "rc" ||
      arr[i].ty === "el" ||
      arr[i].ty === "sr"
    ) {
      if (!processedPos) itemsData[i] = this.createShapeElement(arr[i], ownTransformers, level);

      this.setElementStyles(itemsData[i]);
    } else if (
      arr[i].ty === "tm" ||
      arr[i].ty === "rd" ||
      arr[i].ty === "ms" ||
      arr[i].ty === "pb" ||
      arr[i].ty === "zz" ||
      arr[i].ty === "op"
    ) {
      if (!processedPos) {
        modifier = ShapeModifiers.getModifier(arr[i].ty);
        modifier.init(this, arr[i]);
        itemsData[i] = modifier;
        this.shapeModifiers.push(modifier);
      } else {
        modifier = itemsData[i];
        modifier.closed = false;
      }
      ownModifiers.push(modifier);
    } else if (arr[i].ty === "rp") {
      if (!processedPos) {
        modifier = ShapeModifiers.getModifier(arr[i].ty);
        itemsData[i] = modifier;
        modifier.init(this, arr, i, itemsData);
        this.shapeModifiers.push(modifier);
        render = false;
      } else {
        modifier = itemsData[i];
        modifier.closed = true;
      }
      ownModifiers.push(modifier);
    }
    this.addProcessedElement(arr[i], i + 1);
  }
  for (const ownStyle of ownStyles) ownStyle.closed = true;
  for (const ownModifier of ownModifiers) ownModifier.closed = true;
};

SVGShapeElement.prototype.renderInnerContent = function () {
  this.renderModifiers();
  for (const style of this.stylesList) style.reset();

  this.renderShape();
  for (const style of this.stylesList) {
    if (style._mdf || this._isFirstFrame) {
      if (style.msElem) {
        style.msElem.setAttribute("d", style.d);
        // Adding M0 0 fixes same mask bug on all browsers
        style.d = "M0 0" + style.d;
      }
      style.pElem.setAttribute("d", style.d || "M0 0");
    }
  }
};

SVGShapeElement.prototype.renderShape = function () {
  for (const animatedContent of this.animatedContents) {
    if (
      (this._isFirstFrame || animatedContent.element._isAnimated) &&
      animatedContent.data !== true
    ) {
      animatedContent.fn(animatedContent.data, animatedContent.element, this._isFirstFrame);
    }
  }
};

SVGShapeElement.prototype.destroy = function () {
  this.destroyBaseElement();
  this.shapesData = null;
  this.itemsData = null;
};

export default SVGShapeElement;
