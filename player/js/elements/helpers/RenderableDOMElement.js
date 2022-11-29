import { extendPrototype } from "../../utils/functionExtensions";
import RenderableElement from "./RenderableElement";

function RenderableDOMElement() {}

const _prototype = {
  initElement(data, globalData, comp) {
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initTransform(data, globalData, comp);
    this.initHierarchy();
    this.initRenderable();
    this.initRendererElement();
    this.createContainerElements();
    this.createRenderableComponents();
    this.createContent();
    this.hide();
  },
  hide() {
    // console.log('HIDE', this);
    if (!this.hidden && (!this.isInRange || this.isTransparent)) {
      const elem = this.baseElement || this.layerElement;
      elem.style.display = "none";
      this.hidden = true;
    }
  },
  show() {
    // console.log('SHOW', this);
    if (this.isInRange && !this.isTransparent) {
      if (!this.data.hd) {
        const elem = this.baseElement || this.layerElement;
        elem.style.display = "block";
      }
      this.hidden = false;
      this._isFirstFrame = true;
    }
  },
  renderFrame() {
    // If it is exported as hidden (data.hd === true) no need to render
    // If it is not visible no need to render
    if (this.data.hd || this.hidden) {
      return;
    }
    this.renderTransform();
    this.renderRenderable();
    this.renderElement();
    this.renderInnerContent();
    if (this._isFirstFrame) {
      this._isFirstFrame = false;
    }
  },
  renderInnerContent() {},
  prepareFrame(num) {
    this._mdf = false;
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
    this.checkTransparency();
  },
  destroy() {
    this.innerElem = null;
    this.destroyBaseElement();
  },
};

function ProxyFunction() {}
ProxyFunction.prototype = _prototype;

extendPrototype([RenderableElement, ProxyFunction], RenderableDOMElement);

export default RenderableDOMElement;
