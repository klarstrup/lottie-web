import createNS from "../../../utils/helpers/svg_elements";

function SVGComposableEffect() {}
SVGComposableEffect.prototype = {
  createMergeNode: (resultId, ins) => {
    const feMerge = createNS("feMerge");
    feMerge.setAttribute("result", resultId);

    for (const theIn of ins) {
      const feMergeNode = createNS("feMergeNode");
      feMergeNode.setAttribute("in", theIn);
      feMerge.appendChild(feMergeNode);
      feMerge.appendChild(feMergeNode);
    }

    return feMerge;
  },
};

export default SVGComposableEffect;
