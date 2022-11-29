import { createElementID } from "../../utils/common";
import { createFilter } from "../../utils/filters";

const registeredEffects = {};
const idPrefix = "filter_result_";

function SVGEffects(elem) {
  let source = "SourceGraphic";
  const filId = createElementID();
  const fil = createFilter(filId, true);
  let count = 0;
  this.filters = [];
  let filterManager;
  for (let i = 0; i < elem.data.ef ? elem.data.ef.length : 0; i += 1) {
    filterManager = null;
    const type = elem.data.ef[i].ty;
    if (registeredEffects[type]) {
      const Effect = registeredEffects[type].effect;
      filterManager = new Effect(
        fil,
        elem.effectsManager.effectElements[i],
        elem,
        idPrefix + count,
        source,
      );
      source = idPrefix + count;
      if (registeredEffects[type].countsAsEffect) count += 1;
    }
    if (filterManager) this.filters.push(filterManager);
  }
  if (count) {
    elem.globalData.defs.appendChild(fil);
    elem.layerElement.setAttribute("filter", "url(#" + filId + ")");
  }
  if (this.filters.length) elem.addRenderableComponent(this);
}

SVGEffects.prototype.renderFrame = function (_isFirstFrame) {
  for (const filter of this.filters) filter.renderFrame(_isFirstFrame);
};

export function registerEffect(id, effect, countsAsEffect) {
  registeredEffects[id] = { effect, countsAsEffect };
}

export default SVGEffects;
