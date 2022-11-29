function SVGTransformData(mProps, op, container) {
  this.transform = {
    mProps,
    op,
    container,
  };
  this.elements = [];
  this._isAnimated =
    this.transform.mProps.dynamicProperties.length || this.transform.op.effectsSequence.length;
}

export default SVGTransformData;
