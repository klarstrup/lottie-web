import { extendPrototype } from "../../../utils/functionExtensions";
import DynamicPropertyContainer from "../../../utils/helpers/dynamicProperties";
import { getProp } from "../../../utils/PropertyFactory";

function SVGFillStyleData(elem, data, styleOb) {
  this.initDynamicPropertyContainer(elem);
  this.getValue = this.iterateDynamicProperties;
  this.o = getProp(elem, data.o, 0, 0.01, this);
  this.c = getProp(elem, data.c, 1, 255, this);
  this.style = styleOb;
}

extendPrototype([DynamicPropertyContainer], SVGFillStyleData);

export default SVGFillStyleData;
