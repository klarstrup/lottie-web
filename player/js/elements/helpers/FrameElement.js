/**
 * @file
 * Handles element's layer frame update.
 * Checks layer in point and out point
 *
 */

function FrameElement() {}

FrameElement.prototype = {
  /**
   * @function
   * Initializes frame related properties.
   *
   */
  initFrame() {
    // set to true when inpoint is rendered
    this._isFirstFrame = false;
    // list of animated properties
    this.dynamicProperties = [];
    // If layer has been modified in current tick this will be true
    this._mdf = false;
  },
  /**
   * @function
   * Calculates all dynamic values
   *
   * @param {number} num
   * current frame number in Layer's time
   * @param {boolean} isVisible
   * if layers is currently in range
   *
   */
  prepareProperties(num, isVisible) {
    for (const dynamicProperty of this.dynamicProperties) {
      if (isVisible || (this._isParent && dynamicProperty.propType === "transform")) {
        dynamicProperty.getValue();
        if (dynamicProperty._mdf) {
          this.globalData._mdf = true;
          this._mdf = true;
        }
      }
    }
  },
  addDynamicProperty(prop) {
    if (this.dynamicProperties.indexOf(prop) === -1) this.dynamicProperties.push(prop);
  },
};

export default FrameElement;
