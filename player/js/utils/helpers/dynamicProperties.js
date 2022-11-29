function DynamicPropertyContainer() {}
DynamicPropertyContainer.prototype = {
  addDynamicProperty(prop) {
    if (this.dynamicProperties.indexOf(prop) === -1) {
      this.dynamicProperties.push(prop);
      this.container.addDynamicProperty(this);
      this._isAnimated = true;
    }
  },
  iterateDynamicProperties() {
    this._mdf = false;
    for (const property of this.dynamicProperties) {
      property.getValue();
      if (property._mdf) this._mdf = true;
    }
  },
  initDynamicPropertyContainer(container) {
    this.container = container;
    this.dynamicProperties = [];
    this._mdf = false;
    this._isAnimated = false;
  },
};

export default DynamicPropertyContainer;
