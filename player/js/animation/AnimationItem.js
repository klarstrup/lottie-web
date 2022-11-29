import SVGRenderer from "../renderers/SVGRenderer";
import {
  BMCompleteEvent,
  BMCompleteLoopEvent,
  BMDestroyEvent,
  BMEnterFrameEvent,
  BMSegmentStartEvent,
  createElementID,
} from "../utils/common";
import { completeAnimation } from "../utils/DataManager";
import markerParser from "../utils/markers/markerParser";

export default class AnimationItem {
  _cbs = {};
  triggerEvent(eventName, arg) {
    const callbacks = this._cbs[eventName];
    if (callbacks) for (const callback of callbacks) callback(arg);
  }
  addEventListener(eventName, callback) {
    if (!this._cbs[eventName]) this._cbs[eventName] = [];
    this._cbs[eventName]?.push(callback);

    return () => {
      this.removeEventListener(eventName, callback);
    };
  }
  removeEventListener(eventName, callback) {
    if (!callback) return delete this._cbs[eventName];

    const callbacks = this._cbs[eventName];
    if (callbacks) {
      let i = 0;
      let len = callbacks.length;
      while (i < len) {
        if (callbacks[i] === callback) {
          callbacks.splice(i, 1);
          i -= 1;
          len -= 1;
        }
        i += 1;
      }
      if (!callbacks.length) delete this._cbs[eventName];
    }
  }

  name = "";
  path = "";
  isLoaded = false;
  currentFrame = 0;
  currentRawFrame = 0;
  firstFrame = 0;
  totalFrames = 0;
  frameRate = 0;
  frameMult = 0;
  playSpeed = 1;
  playDirection = 1;
  playCount = 0;
  animationData = {};
  assets = [];
  isPaused = true;
  autoplay = false;
  loop = true;
  renderer = null;
  animType;
  animationID = createElementID();
  assetsPath = "";
  timeCompleted = 0;
  segmentPos = 0;
  isSubframeEnabled = true;
  segments = [];
  _idle = true;
  _completedLoop = false;
  markers = [];
  drawnFrameEvent = new BMEnterFrameEvent("drawnFrame", 0, 0, 0);
  wrapper = null;

  setParams(params) {
    if (params.wrapper || params.container) this.wrapper = params.wrapper || params.container;

    this.renderer = new SVGRenderer(this, params.rendererSettings);
    this.animType = "svg";
    if (
      params.loop === "" ||
      params.loop === null ||
      params.loop === undefined ||
      params.loop === true
    ) {
      this.loop = true;
    } else if (params.loop === false) {
      this.loop = false;
    } else {
      this.loop = parseInt(params.loop, 10);
    }
    this.autoplay = "autoplay" in params ? params.autoplay : true;
    this.name = params.name ? params.name : "";
    this.autoloadSegments = Object.prototype.hasOwnProperty.call(params, "autoloadSegments")
      ? params.autoloadSegments
      : true;
    this.assetsPath = params.assetsPath;
    this.initialSegment = params.initialSegment;

    if (params.animationData) this.setupAnimation(params.animationData);
  }
  onSetupError = () => {
    this.trigger("data_failed");
  };
  setupAnimation(data) {
    completeAnimation(data, this.configAnimation);
  }
  includeLayers(data) {
    if (data.op > this.animationData.op) {
      this.animationData.op = data.op;
      this.totalFrames = Math.floor(data.op - this.animationData.ip);
    }
    const layers = this.animationData.layers;
    const newLayers = data.layers;
    const len = layers.length;
    for (const newLayer of newLayers) {
      i = 0;
      while (i < len) {
        if (layers[i].id === newLayer.id) {
          layers[i] = newLayer;
          break;
        }
        i += 1;
      }
    }
    if (data.chars || data.fonts) {
      this.renderer.globalData.fontManager.addChars(data.chars);
      this.renderer.globalData.fontManager.addFonts(data.fonts, this.renderer.globalData.defs);
    }
    if (data.assets) for (const asset of data.assets) this.animationData.assets.push(asset);

    this.animationData.__complete = false;
    dataManager.completeAnimation(this.animationData, this.onSegmentComplete);
  }
  onSegmentComplete = data => {
    this.animationData = data;

    this.loadNextSegment();
  };
  loadNextSegment() {
    const segments = this.animationData.segments;
    if (!segments || segments.length === 0 || !this.autoloadSegments) {
      this.trigger("data_ready");
      this.timeCompleted = this.totalFrames;
      return;
    }
    const segment = segments.shift();
    this.timeCompleted = segment.time * this.frameRate;
    const segmentPath = this.path + this.fileName + "_" + this.segmentPos + ".json";
    this.segmentPos += 1;
    dataManager.loadData(
      segmentPath,
      () => this.includeLayers(),
      () => this.trigger("data_failed"),
    );
  }
  loadSegments() {
    const segments = this.animationData.segments;
    if (!segments) this.timeCompleted = this.totalFrames;

    this.loadNextSegment();
  }
  imagesLoaded() {
    this.trigger("loaded_images");
    this.checkLoaded();
  }
  configAnimation = animData => {
    if (!this.renderer) return;

    this.animationData = animData;
    if (this.initialSegment) {
      this.totalFrames = Math.floor(this.initialSegment[1] - this.initialSegment[0]);
      this.firstFrame = Math.round(this.initialSegment[0]);
    } else {
      this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip);
      this.firstFrame = Math.round(this.animationData.ip);
    }
    this.renderer.configAnimation(animData);
    if (!animData.assets) {
      animData.assets = [];
    }

    this.assets = this.animationData.assets;
    this.frameRate = this.animationData.fr;
    this.frameMult = this.animationData.fr / 1000;
    this.renderer.searchExtraCompositions(animData.assets);
    this.markers = markerParser(animData.markers || []);
    this.trigger("config_ready");
    this.loadSegments();
    this.updaFrameModifier();
    this.waitForFontsLoaded();
  };
  waitForFontsLoaded() {
    if (!this.renderer) return;

    if (this.renderer.globalData.fontManager.isLoaded) {
      this.checkLoaded();
    } else {
      setTimeout(() => this.waitForFontsLoaded(), 20);
    }
  }
  checkLoaded() {
    if (!this.isLoaded && this.renderer.globalData.fontManager.isLoaded) {
      this.isLoaded = true;
      this.renderer.initItems();
      setTimeout(() => {
        this.trigger("DOMLoaded");
      }, 0);
      this.gotoFrame();
      if (this.autoplay) this.play();
    }
  }
  resize(width, height) {
    // Adding this validation for backwards compatibility in case an event object was being passed down
    const _width = typeof width === "number" ? width : undefined;
    const _height = typeof height === "number" ? height : undefined;
    this.renderer.updateContainerSize(_width, _height);
  }
  setSubframe(flag) {
    this.isSubframeEnabled = !!flag;
  }
  gotoFrame() {
    this.currentFrame = this.isSubframeEnabled ? this.currentRawFrame : ~~this.currentRawFrame; // eslint-disable-line no-bitwise

    if (this.timeCompleted !== this.totalFrames && this.currentFrame > this.timeCompleted) {
      this.currentFrame = this.timeCompleted;
    }
    this.trigger("enterFrame");
    this.renderFrame();
    this.trigger("drawnFrame");
  }
  renderFrame() {
    if (!this.isLoaded || !this.renderer) return;

    this.renderer.renderFrame(this.currentFrame + this.firstFrame);
  }
  play(name) {
    if (name && this.name !== name) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.trigger("_pause");
      if (this._idle) {
        this._idle = false;
        this.trigger("_active");
      }
    }
  }
  pause(name) {
    if (name && this.name !== name) return;

    if (!this.isPaused) {
      this.isPaused = true;
      this.trigger("_play");
      this._idle = true;
      this.trigger("_idle");
    }
  }
  togglePause(name) {
    if (name && this.name !== name) return;

    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
    }
  }
  stop(name) {
    if (name && this.name !== name) return;

    this.pause();
    this.playCount = 0;
    this._completedLoop = false;
    this.setCurrentRawFrameValue(0);
  }
  getMarkerData(markerName) {
    for (const marker of markers) if (marker.payload?.name === markerName) return marker;

    return null;
  }
  goToAndStop(value, isFrame, name) {
    if (name && this.name !== name) return;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      const marker = this.getMarkerData(value);
      if (marker) this.goToAndStop(marker.time, true);
    } else if (isFrame) {
      this.setCurrentRawFrameValue(value);
    } else {
      this.setCurrentRawFrameValue(value * this.frameModifier);
    }
    this.pause();
  }
  goToAndPlay(value, isFrame, name) {
    if (name && this.name !== name) return;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      const marker = this.getMarkerData(value);
      if (marker) {
        if (!marker.duration) {
          this.goToAndStop(marker.time, true);
        } else {
          this.playSegments([marker.time, marker.time + marker.duration], true);
        }
      }
    } else {
      this.goToAndStop(numValue, isFrame, name);
    }
    this.play();
  }
  advanceTime(value) {
    if (this.isPaused || !this.isLoaded) {
      return;
    }
    let nextValue = this.currentRawFrame + value * this.frameModifier;
    let _isComplete = false;
    // Checking if nextValue > totalFrames - 1 for addressing non looping and looping animations.
    // If animation won't loop, it should stop at totalFrames - 1. If it will loop it should complete the last frame and then loop.
    if (nextValue >= this.totalFrames - 1 && this.frameModifier > 0) {
      if (!this.loop || this.playCount === this.loop) {
        if (!this.checkSegments(nextValue > this.totalFrames ? nextValue % this.totalFrames : 0)) {
          _isComplete = true;
          nextValue = this.totalFrames - 1;
        }
      } else if (nextValue >= this.totalFrames) {
        this.playCount += 1;
        if (!this.checkSegments(nextValue % this.totalFrames)) {
          this.setCurrentRawFrameValue(nextValue % this.totalFrames);
          this._completedLoop = true;
          this.trigger("loopComplete");
        }
      } else {
        this.setCurrentRawFrameValue(nextValue);
      }
    } else if (nextValue < 0) {
      if (!this.checkSegments(nextValue % this.totalFrames)) {
        if (this.loop && !(this.playCount-- <= 0 && this.loop !== true)) {
          // eslint-disable-line no-plusplus
          this.setCurrentRawFrameValue(this.totalFrames + (nextValue % this.totalFrames));
          if (!this._completedLoop) {
            this._completedLoop = true;
          } else {
            this.trigger("loopComplete");
          }
        } else {
          _isComplete = true;
          nextValue = 0;
        }
      }
    } else {
      this.setCurrentRawFrameValue(nextValue);
    }
    if (_isComplete) {
      this.setCurrentRawFrameValue(nextValue);
      this.pause();
      this.trigger("complete");
    }
  }
  adjustSegment(arr, offset) {
    this.playCount = 0;
    if (arr[1] < arr[0]) {
      if (this.frameModifier > 0) {
        if (this.playSpeed < 0) {
          this.setSpeed(-this.playSpeed);
        } else {
          this.setDirection(-1);
        }
      }
      this.totalFrames = arr[0] - arr[1];
      this.timeCompleted = this.totalFrames;
      this.firstFrame = arr[1];
      this.setCurrentRawFrameValue(this.totalFrames - 0.001 - offset);
    } else if (arr[1] > arr[0]) {
      if (this.frameModifier < 0) {
        if (this.playSpeed < 0) {
          this.setSpeed(-this.playSpeed);
        } else {
          this.setDirection(1);
        }
      }
      this.totalFrames = arr[1] - arr[0];
      this.timeCompleted = this.totalFrames;
      this.firstFrame = arr[0];
      this.setCurrentRawFrameValue(0.001 + offset);
    }
    this.trigger("segmentStart");
  }
  setSegment(init, end) {
    let pendingFrame = -1;
    if (this.isPaused) {
      if (this.currentRawFrame + this.firstFrame < init) {
        pendingFrame = init;
      } else if (this.currentRawFrame + this.firstFrame > end) {
        pendingFrame = end - init;
      }
    }

    this.firstFrame = init;
    this.totalFrames = end - init;
    this.timeCompleted = this.totalFrames;
    if (pendingFrame !== -1) {
      this.goToAndStop(pendingFrame, true);
    }
  }
  playSegments(arr, forceFlag) {
    if (forceFlag) {
      this.segments.length = 0;
    }
    if (typeof arr[0] === "object") {
      for (const item of arr) this.segments.push(item);
    } else {
      this.segments.push(arr);
    }
    if (this.segments.length && forceFlag) {
      this.adjustSegment(this.segments.shift(), 0);
    }
    if (this.isPaused) this.play();
  }
  checkSegments(offset) {
    if (this.segments.length) {
      this.adjustSegment(this.segments.shift(), offset);
      return true;
    }
    return false;
  }
  destroy(name) {
    if ((name && this.name !== name) || !this.renderer) return;

    this.renderer.destroy();
    this.trigger("destroy");
    this.renderer = null;
    this.renderer = null;
  }
  setCurrentRawFrameValue(value) {
    this.currentRawFrame = value;
    this.gotoFrame();
  }
  setSpeed(val) {
    this.playSpeed = val;
    this.updaFrameModifier();
  }
  setDirection(val) {
    this.playDirection = val < 0 ? -1 : 1;
    this.updaFrameModifier();
  }
  updaFrameModifier() {
    this.frameModifier = this.frameMult * this.playSpeed * this.playDirection;
  }
  getPath() {
    return this.path;
  }
  getAssetsPath(assetData) {
    let path = "";
    if (assetData.e) {
      path = assetData.p;
    } else if (this.assetsPath) {
      let imagePath = assetData.p;
      if (imagePath.contains("images/")) imagePath = imagePath.split("/")[1];

      path = this.assetsPath + imagePath;
    } else {
      path = this.path;
      path += assetData.u ? assetData.u : "";
      path += assetData.p;
    }
    return path;
  }
  getAssetData(id) {
    const len = this.assets.length;
    let i = 0;
    while (i < len) {
      if (id === this.assets[i]?.id) return this.assets[i];

      i += 1;
    }
    return null;
  }
  hide() {
    this.renderer?.hide();
  }
  show() {
    this.renderer?.show();
  }
  getDuration(isFrame) {
    return isFrame ? this.totalFrames : this.totalFrames / this.frameRate;
  }
  updateDocumentData(path, documentData, index) {
    try {
      const element = this.renderer.getElementByPath(path);
      element.updateDocumentData(documentData, index);
    } catch (error) {
      // TODO: decide how to handle catch case
    }
  }
  trigger(name) {
    if (this._cbs[name]) {
      switch (name) {
        case "enterFrame":
          this.triggerEvent(
            name,
            new BMEnterFrameEvent(name, this.currentFrame, this.totalFrames, this.frameModifier),
          );
          break;
        case "drawnFrame":
          this.drawnFrameEvent.currentTime = this.currentFrame;
          this.drawnFrameEvent.totalTime = this.totalFrames;
          this.drawnFrameEvent.direction = this.frameModifier;
          this.triggerEvent(name, this.drawnFrameEvent);
          break;
        case "loopComplete":
          this.triggerEvent(
            name,
            new BMCompleteLoopEvent(name, this.loop, this.playCount, this.frameMult),
          );
          break;
        case "complete":
          this.triggerEvent(name, new BMCompleteEvent(name, this.frameMult));
          break;
        case "segmentStart":
          this.triggerEvent(name, new BMSegmentStartEvent(name, this.firstFrame, this.totalFrames));
          break;
        case "destroy":
          this.triggerEvent(name, new BMDestroyEvent(name, this));
          break;
        default:
          this.triggerEvent(name);
      }
    }
  }
}
