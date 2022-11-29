import { createElementID } from "./utils/common";
import { createSizedArray } from "./utils/helpers/arrays";
import createNS from "./utils/helpers/svg_elements";
import { getProp } from "./utils/PropertyFactory";
import { getShapeProp } from "./utils/shapes/ShapeProperty";

function MaskElement(data, element, globalData) {
  this.data = data;
  this.element = element;
  this.globalData = globalData;
  this.storedData = [];
  this.masksProperties = this.data.masksProperties || [];
  this.maskElement = null;
  const defs = this.globalData.defs;
  const len = this.masksProperties ? this.masksProperties.length : 0;
  this.viewData = createSizedArray(len);
  this.solidPath = "";

  const properties = this.masksProperties;
  let count = 0;
  const currentMasks = [];
  const layerId = createElementID();
  let rect;
  let feMorph;
  let x;
  let maskType = "clipPath";
  let maskRef = "clip-path";
  for (let i = 0; i < len; i += 1) {
    if (
      (properties[i].mode !== "a" && properties[i].mode !== "n") ||
      properties[i].inv ||
      properties[i].o.k !== 100 ||
      properties[i].o.x
    ) {
      maskType = "mask";
      maskRef = "mask";
    }

    if ((properties[i].mode === "s" || properties[i].mode === "i") && count === 0) {
      rect = createNS("rect");
      rect.setAttribute("fill", "#ffffff");
      rect.setAttribute("width", this.element.comp.data.w || 0);
      rect.setAttribute("height", this.element.comp.data.h || 0);
      currentMasks.push(rect);
    } else {
      rect = null;
    }

    const path = createNS("path");
    if (properties[i].mode === "n") {
      // TODO move this to a factory or to a constructor
      this.viewData[i] = {
        op: getProp(this.element, properties[i].o, 0, 0.01, this.element),
        prop: getShapeProp(this.element, properties[i], 3),
        elem: path,
        lastPath: "",
      };
      defs.appendChild(path);
    } else {
      count += 1;

      path.setAttribute("fill", properties[i].mode === "s" ? "#000000" : "#ffffff");
      path.setAttribute("clip-rule", "nonzero");
      let filterID;

      if (properties[i].x.k !== 0) {
        maskType = "mask";
        maskRef = "mask";
        x = getProp(this.element, properties[i].x, 0, null, this.element);
        filterID = createElementID();
        const expansor = createNS("filter");
        expansor.setAttribute("id", filterID);
        feMorph = createNS("feMorphology");
        feMorph.setAttribute("operator", "erode");
        feMorph.setAttribute("in", "SourceGraphic");
        feMorph.setAttribute("radius", "0");
        expansor.appendChild(feMorph);
        defs.appendChild(expansor);
        path.setAttribute("stroke", properties[i].mode === "s" ? "#000000" : "#ffffff");
      } else {
        feMorph = null;
        x = null;
      }

      // TODO move this to a factory or to a constructor
      this.storedData[i] = {
        elem: path,
        x,
        expan: feMorph,
        lastPath: "",
        lastOperator: "",
        filterId: filterID,
        lastRadius: 0,
      };
      if (properties[i].mode === "i") {
        const g = createNS("g");
        for (const currentMask of currentMasks) g.appendChild(currentMask);

        const mask = createNS("mask");
        mask.setAttribute("mask-type", "alpha");
        mask.setAttribute("id", layerId + "_" + count);
        mask.appendChild(path);
        defs.appendChild(mask);
        g.setAttribute("mask", "url(#" + layerId + "_" + count + ")");

        currentMasks.length = 0;
        currentMasks.push(g);
      } else {
        currentMasks.push(path);
      }
      if (properties[i].inv && !this.solidPath) {
        this.solidPath = this.createLayerSolidPath();
      }
      // TODO move this to a factory or to a constructor
      this.viewData[i] = {
        elem: path,
        lastPath: "",
        op: getProp(this.element, properties[i].o, 0, 0.01, this.element),
        prop: getShapeProp(this.element, properties[i], 3),
        invRect: rect,
      };
      if (!this.viewData[i].prop.k) {
        this.drawPath(properties[i], this.viewData[i].prop.v, this.viewData[i]);
      }
    }
  }

  this.maskElement = createNS(maskType);

  for (const currentMask of currentMasks) this.maskElement.appendChild(currentMask);

  if (count > 0) {
    this.maskElement.setAttribute("id", layerId);
    this.element.maskedElement.setAttribute(maskRef, "url(#" + layerId + ")");
    defs.appendChild(this.maskElement);
  }
  if (this.viewData.length) this.element.addRenderableComponent(this);
}

MaskElement.prototype.getMaskProperty = function (pos) {
  return this.viewData[pos].prop;
};

MaskElement.prototype.renderFrame = function (isFirstFrame) {
  const finalMat = this.element.finalTransform.mat;

  for (let i = 0; i < this.masksProperties.length; i += 1) {
    if (this.viewData[i].prop._mdf || isFirstFrame) {
      this.drawPath(this.masksProperties[i], this.viewData[i].prop.v, this.viewData[i]);
    }
    if (this.viewData[i].op._mdf || isFirstFrame) {
      this.viewData[i].elem.setAttribute("fill-opacity", this.viewData[i].op.v);
    }
    if (this.masksProperties[i].mode !== "n") {
      if (this.viewData[i].invRect && (this.element.finalTransform.mProp._mdf || isFirstFrame)) {
        this.viewData[i].invRect.setAttribute("transform", finalMat.getInverseMatrix().to2dCSS());
      }
      if (this.storedData[i].x && (this.storedData[i].x._mdf || isFirstFrame)) {
        const feMorph = this.storedData[i].expan;
        if (this.storedData[i].x.v < 0) {
          if (this.storedData[i].lastOperator !== "erode") {
            this.storedData[i].lastOperator = "erode";
            this.storedData[i].elem.setAttribute(
              "filter",
              "url(#" + this.storedData[i].filterId + ")",
            );
          }
          feMorph.setAttribute("radius", -this.storedData[i].x.v);
        } else {
          if (this.storedData[i].lastOperator !== "dilate") {
            this.storedData[i].lastOperator = "dilate";
            this.storedData[i].elem.setAttribute("filter", null);
          }
          this.storedData[i].elem.setAttribute("stroke-width", this.storedData[i].x.v * 2);
        }
      }
    }
  }
};

MaskElement.prototype.getMaskelement = function () {
  return this.maskElement;
};

MaskElement.prototype.createLayerSolidPath = function () {
  let path = "M0,0 ";
  path += " h" + this.globalData.compSize.w;
  path += " v" + this.globalData.compSize.h;
  path += " h-" + this.globalData.compSize.w;
  path += " v-" + this.globalData.compSize.h + " ";
  return path;
};

MaskElement.prototype.drawPath = function (pathData, pathNodes, viewData) {
  let pathString = " M" + pathNodes.v[0][0] + "," + pathNodes.v[0][1];

  for (let i = 1; i < pathNodes._length; i += 1) {
    pathString +=
      " C" +
      pathNodes.o[i - 1][0] +
      "," +
      pathNodes.o[i - 1][1] +
      " " +
      pathNodes.i[i][0] +
      "," +
      pathNodes.i[i][1] +
      " " +
      pathNodes.v[i][0] +
      "," +
      pathNodes.v[i][1];
  }

  if (pathNodes.c && len > 1) {
    pathString +=
      " C" +
      pathNodes.o[i - 1][0] +
      "," +
      pathNodes.o[i - 1][1] +
      " " +
      pathNodes.i[0][0] +
      "," +
      pathNodes.i[0][1] +
      " " +
      pathNodes.v[0][0] +
      "," +
      pathNodes.v[0][1];
  }

  if (viewData.lastPath !== pathString) {
    let pathShapeValue = "";
    if (viewData.elem) {
      if (pathNodes.c) {
        pathShapeValue = pathData.inv ? this.solidPath + pathString : pathString;
      }
      viewData.elem.setAttribute("d", pathShapeValue);
    }
    viewData.lastPath = pathString;
  }
};

MaskElement.prototype.destroy = function () {
  this.element = null;
  this.globalData = null;
  this.maskElement = null;
  this.data = null;
  this.masksProperties = null;
};

export default MaskElement;
