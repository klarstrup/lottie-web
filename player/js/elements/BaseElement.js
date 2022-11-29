import EffectsManager from "../EffectsManager";
import { createElementID } from "../utils/common";
import getBlendMode from "../utils/helpers/blendModes";

function BaseElement() {}

BaseElement.prototype = {
  checkMasks() {
    if (!this.data.hasMask) {
      return false;
    }
    let i = 0;
    const len = this.data.masksProperties.length;
    while (i < len) {
      if (this.data.masksProperties[i].mode !== "n" && this.data.masksProperties[i].cl !== false) {
        return true;
      }
      i += 1;
    }
    return false;
  },
  initExpressions() {},
  setBlendMode() {
    const blendModeValue = getBlendMode(this.data.bm);
    const elem = this.baseElement || this.layerElement;

    elem.style["mix-blend-mode"] = blendModeValue;
  },
  initBaseData(data, globalData, comp) {
    this.globalData = globalData;
    this.comp = comp;
    this.data = data;
    this.layerId = createElementID();

    // Stretch factor for old animations missing this property.
    if (!this.data.sr) {
      this.data.sr = 1;
    }
    // effects manager
    this.effectsManager = new EffectsManager(this.data, this, this.dynamicProperties);
  },
  getType() {
    return this.type;
  },
  sourceRectAtTime() {},
};

export default BaseElement;
