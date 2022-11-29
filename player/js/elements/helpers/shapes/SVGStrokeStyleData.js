import { extendPrototype } from "../../../utils/functionExtensions";
import DynamicPropertyContainer from "../../../utils/helpers/dynamicProperties";
import { getProp } from "../../../utils/PropertyFactory";
import DashProperty from "../../../utils/shapes/DashProperty";

function SVGStrokeStyleData(elem, data, styleOb) {
  this.initDynamicPropertyContainer(elem);
  this.getValue = this.iterateDynamicProperties;
  this.o = getProp(elem, data.o, 0, 0.01, this);
  this.w = getProp(elem, data.w, 0, null, this);
  this.d = new DashProperty(elem, data.d || {}, "svg", this);
  this.c = getProp(elem, data.c, 1, 255, this);
  this.style = styleOb;
  this._isAnimated = !!this._isAnimated;
}

extendPrototype([DynamicPropertyContainer], SVGStrokeStyleData);

export default SVGStrokeStyleData;
