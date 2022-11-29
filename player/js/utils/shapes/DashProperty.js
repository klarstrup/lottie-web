import { extendPrototype } from "../functionExtensions";
import { createSizedArray, createTypedArray } from "../helpers/arrays";
import DynamicPropertyContainer from "../helpers/dynamicProperties";
import { getProp } from "../PropertyFactory";

function DashProperty(elem, data, renderer, container) {
  this.elem = elem;
  this.frameId = -1;
  this.dataProps = createSizedArray(data.length);
  this.renderer = renderer;
  this.k = false;
  this.dashStr = "";
  this.dashArray = createTypedArray("float32", data.length ? data.length - 1 : 0);
  this.dashoffset = createTypedArray("float32", 1);
  this.initDynamicPropertyContainer(container);
  for (const datum of data) {
    const prop = getProp(elem, datum.v, 0, 0, this);
    this.k = prop.k || this.k;
    this.dataProps[i] = { n: datum.n, p: prop };
  }
  if (!this.k) this.getValue(true);

  this._isAnimated = this.k;
}

DashProperty.prototype.getValue = function (forceRender) {
  if (this.elem.globalData.frameId === this.frameId && !forceRender) return;

  this.frameId = this.elem.globalData.frameId;
  this.iterateDynamicProperties();
  this._mdf = this._mdf || forceRender;
  if (this._mdf) {
    if (this.renderer === "svg") this.dashStr = "";

    for (let i = 0; i < this.dataProps.length; i += 1) {
      if (this.dataProps[i].n !== "o") {
        if (this.renderer === "svg") {
          this.dashStr += " " + this.dataProps[i].p.v;
        } else {
          this.dashArray[i] = this.dataProps[i].p.v;
        }
      } else {
        this.dashoffset[0] = this.dataProps[i].p.v;
      }
    }
  }
};
extendPrototype([DynamicPropertyContainer], DashProperty);

export default DashProperty;
