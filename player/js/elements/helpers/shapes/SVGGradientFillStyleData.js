import { createElementID, degToRads } from "../../../utils/common";
import { extendPrototype } from "../../../utils/functionExtensions";
import DynamicPropertyContainer from "../../../utils/helpers/dynamicProperties";
import { lineCapEnum, lineJoinEnum } from "../../../utils/helpers/shapeEnums";
import createNS from "../../../utils/helpers/svg_elements";
import { getProp } from "../../../utils/PropertyFactory";
import GradientProperty from "../../../utils/shapes/GradientProperty";

function SVGGradientFillStyleData(elem, data, styleOb) {
  this.initDynamicPropertyContainer(elem);
  this.getValue = this.iterateDynamicProperties;
  this.initGradientData(elem, data, styleOb);
}

SVGGradientFillStyleData.prototype.initGradientData = function (elem, data, styleOb) {
  this.o = getProp(elem, data.o, 0, 0.01, this);
  this.s = getProp(elem, data.s, 1, null, this);
  this.e = getProp(elem, data.e, 1, null, this);
  this.h = getProp(elem, data.h || { k: 0 }, 0, 0.01, this);
  this.a = getProp(elem, data.a || { k: 0 }, 0, degToRads, this);
  this.g = new GradientProperty(elem, data.g, this);
  this.style = styleOb;
  this.stops = [];
  this.setGradientData(styleOb.pElem, data);
  this.setGradientOpacity(data, styleOb);
  this._isAnimated = !!this._isAnimated;
};

SVGGradientFillStyleData.prototype.setGradientData = function (pathElement, data) {
  const gradientId = createElementID();
  const gfill = createNS(data.t === 1 ? "linearGradient" : "radialGradient");
  gfill.setAttribute("id", gradientId);
  gfill.setAttribute("spreadMethod", "pad");
  gfill.setAttribute("gradientUnits", "userSpaceOnUse");
  const stops = [];
  for (let j = 0; j < data.g.p * 4; j += 4) {
    const stop = createNS("stop");
    gfill.appendChild(stop);
    stops.push(stop);
  }
  pathElement.setAttribute(data.ty === "gf" ? "fill" : "stroke", "url(#" + gradientId + ")");
  this.gf = gfill;
  this.cst = stops;
};

SVGGradientFillStyleData.prototype.setGradientOpacity = function (data, styleOb) {
  if (this.g._hasOpacity && !this.g._collapsable) {
    const mask = createNS("mask");
    const maskElement = createNS("path");
    mask.appendChild(maskElement);
    const opacityId = createElementID();
    const maskId = createElementID();
    mask.setAttribute("id", maskId);
    const opFill = createNS(data.t === 1 ? "linearGradient" : "radialGradient");
    opFill.setAttribute("id", opacityId);
    opFill.setAttribute("spreadMethod", "pad");
    opFill.setAttribute("gradientUnits", "userSpaceOnUse");
    const stops = this.stops;
    for (
      let j = data.g.p * 4;
      j < data.g.k.k[0].s ? data.g.k.k[0].s.length : data.g.k.k.length;
      j += 2
    ) {
      const stop = createNS("stop");
      stop.setAttribute("stop-color", "rgb(255,255,255)");
      opFill.appendChild(stop);
      stops.push(stop);
    }
    maskElement.setAttribute(data.ty === "gf" ? "fill" : "stroke", "url(#" + opacityId + ")");
    if (data.ty === "gs") {
      maskElement.setAttribute("stroke-linecap", lineCapEnum[data.lc || 2]);
      maskElement.setAttribute("stroke-linejoin", lineJoinEnum[data.lj || 2]);
      if (data.lj === 1) maskElement.setAttribute("stroke-miterlimit", data.ml);
    }
    this.of = opFill;
    this.ms = mask;
    this.ost = stops;
    this.maskId = maskId;
    styleOb.msElem = maskElement;
  }
};

extendPrototype([DynamicPropertyContainer], SVGGradientFillStyleData);

export default SVGGradientFillStyleData;
