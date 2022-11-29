import MaskElement from "../../mask";
import { createElementID } from "../../utils/common";
import { maskType } from "../../utils/featureSupport";
import { createFilter } from "../../utils/filters";
import createNS from "../../utils/helpers/svg_elements";
import SVGEffects from "./SVGEffects";

function SVGBaseElement() {}

SVGBaseElement.prototype = {
  initRendererElement() {
    this.layerElement = createNS("g");
  },
  createContainerElements() {
    this.matteElement = createNS("g");
    this.transformedElement = this.layerElement;
    this.maskedElement = this.layerElement;
    this._sizeChanged = false;
    let layerElementParent = null;
    // If this layer acts as a mask for the following layer
    if (this.data.td) {
      this.matteMasks = {};
      const symbolElement = createNS("symbol");
      symbolElement.setAttribute("id", this.layerId);
      const gg = createNS("g");
      gg.appendChild(this.layerElement);
      symbolElement.appendChild(gg);
      layerElementParent = gg;
      this.globalData.defs.appendChild(symbolElement);
    } else if (this.data.tt) {
      this.matteElement.appendChild(this.layerElement);
      layerElementParent = this.matteElement;
      this.baseElement = this.matteElement;
    } else {
      this.baseElement = this.layerElement;
    }
    if (this.data.ln) {
      this.layerElement.setAttribute("id", this.data.ln);
    }
    if (this.data.cl) {
      this.layerElement.setAttribute("class", this.data.cl);
    }
    // Clipping compositions to hide content that exceeds boundaries. If collapsed transformations is on, component should not be clipped
    if (this.data.ty === 0 && !this.data.hd) {
      const cp = createNS("clipPath");
      const pt = createNS("path");
      pt.setAttribute(
        "d",
        "M0,0 L" +
          this.data.w +
          ",0 L" +
          this.data.w +
          "," +
          this.data.h +
          " L0," +
          this.data.h +
          "z",
      );
      const clipId = createElementID();
      cp.setAttribute("id", clipId);
      cp.appendChild(pt);
      this.globalData.defs.appendChild(cp);

      if (this.checkMasks()) {
        const cpGroup = createNS("g");
        cpGroup.setAttribute("clip-path", "url(#" + clipId + ")");
        cpGroup.appendChild(this.layerElement);
        this.transformedElement = cpGroup;
        if (layerElementParent) {
          layerElementParent.appendChild(this.transformedElement);
        } else {
          this.baseElement = this.transformedElement;
        }
      } else {
        this.layerElement.setAttribute("clip-path", "url(#" + clipId + ")");
      }
    }
    if (this.data.bm !== 0) {
      this.setBlendMode();
    }
  },
  renderElement() {
    if (this.finalTransform._matMdf) {
      this.transformedElement.setAttribute("transform", this.finalTransform.mat.to2dCSS());
    }
    if (this.finalTransform._opMdf) {
      this.transformedElement.setAttribute("opacity", this.finalTransform.mProp.o.v);
    }
  },
  destroyBaseElement() {
    this.layerElement = null;
    this.matteElement = null;
    this.maskManager.destroy();
  },
  getBaseElement() {
    if (this.data.hd) {
      return null;
    }
    return this.baseElement;
  },
  createRenderableComponents() {
    this.maskManager = new MaskElement(this.data, this, this.globalData);
    this.renderableEffectsManager = new SVGEffects(this);
  },
  getMatte(matteType) {
    if (!this.matteMasks[matteType]) {
      const id = this.layerId + "_" + matteType;
      let filId;
      let fil;
      let useElement;
      let gg;
      if (matteType === 1 || matteType === 3) {
        const masker = createNS("mask");
        masker.setAttribute("id", id);
        masker.setAttribute("mask-type", matteType === 3 ? "luminance" : "alpha");
        useElement = createNS("use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId);
        masker.appendChild(useElement);
        this.globalData.defs.appendChild(masker);
        if (!maskType && matteType === 1) {
          masker.setAttribute("mask-type", "luminance");
          filId = createElementID();
          fil = createFilter(filId);
          this.globalData.defs.appendChild(fil);
          fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
          gg = createNS("g");
          gg.appendChild(useElement);
          masker.appendChild(gg);
          gg.setAttribute("filter", "url(#" + filId + ")");
        }
      } else if (matteType === 2) {
        const maskGroup = createNS("mask");
        maskGroup.setAttribute("id", id);
        maskGroup.setAttribute("mask-type", "alpha");
        const maskGrouper = createNS("g");
        maskGroup.appendChild(maskGrouper);
        filId = createElementID();
        fil = createFilter(filId);
        /// /
        const feCTr = createNS("feComponentTransfer");
        feCTr.setAttribute("in", "SourceGraphic");
        fil.appendChild(feCTr);
        const feFunc = createNS("feFuncA");
        feFunc.setAttribute("type", "table");
        feFunc.setAttribute("tableValues", "1.0 0.0");
        feCTr.appendChild(feFunc);
        /// /
        this.globalData.defs.appendChild(fil);
        const alphaRect = createNS("rect");
        alphaRect.setAttribute("width", this.comp.data.w);
        alphaRect.setAttribute("height", this.comp.data.h);
        alphaRect.setAttribute("x", "0");
        alphaRect.setAttribute("y", "0");
        alphaRect.setAttribute("fill", "#ffffff");
        alphaRect.setAttribute("opacity", "0");
        maskGrouper.setAttribute("filter", "url(#" + filId + ")");
        maskGrouper.appendChild(alphaRect);
        useElement = createNS("use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId);
        maskGrouper.appendChild(useElement);
        if (!maskType) {
          maskGroup.setAttribute("mask-type", "luminance");
          fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
          gg = createNS("g");
          maskGrouper.appendChild(alphaRect);
          gg.appendChild(this.layerElement);
          maskGrouper.appendChild(gg);
        }
        this.globalData.defs.appendChild(maskGroup);
      }
      this.matteMasks[matteType] = id;
    }
    return this.matteMasks[matteType];
  },
  setMatte(id) {
    if (!this.matteElement) {
      return;
    }
    this.matteElement.setAttribute("mask", "url(#" + id + ")");
  },
};

export default SVGBaseElement;
