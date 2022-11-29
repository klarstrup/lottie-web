export const degToRads = Math.PI / 180;
export const roundCorner = 0.5519;

export function BMEnterFrameEvent(type, currentTime, totalTime, frameMultiplier) {
  this.type = type;
  this.currentTime = currentTime;
  this.totalTime = totalTime;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

export function BMCompleteEvent(type, frameMultiplier) {
  this.type = type;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

export function BMCompleteLoopEvent(type, totalLoops, currentLoop, frameMultiplier) {
  this.type = type;
  this.currentLoop = currentLoop;
  this.totalLoops = totalLoops;
  this.direction = frameMultiplier < 0 ? -1 : 1;
}

export function BMSegmentStartEvent(type, firstFrame, totalFrames) {
  this.type = type;
  this.firstFrame = firstFrame;
  this.totalFrames = totalFrames;
}

export function BMDestroyEvent(type, target) {
  this.type = type;
  this.target = target;
}

export function BMRenderFrameErrorEvent(nativeError, currentTime) {
  this.type = "renderFrameError";
  this.nativeError = nativeError;
  this.currentTime = currentTime;
}

export function BMConfigErrorEvent(nativeError) {
  this.type = "configError";
  this.nativeError = nativeError;
}

export function BMAnimationConfigErrorEvent(type, nativeError) {
  this.type = type;
  this.nativeError = nativeError;
}

let _count = 0;
export const createElementID = () => "__lottie_element_" + ++_count;

export function HSVtoRGB(h, s, v) {
  const j = Math.floor(h * 6);
  const f = h * 6 - j;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (j % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
}

export function RGBtoHSV(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
    default:
      break;
  }

  return [h, s, v];
}

export function addSaturationToRGB(color, offset) {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[1] += offset;
  if (hsv[1] > 1) {
    hsv[1] = 1;
  } else if (hsv[1] <= 0) {
    hsv[1] = 0;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

export function addBrightnessToRGB(color, offset) {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[2] += offset;
  if (hsv[2] > 1) {
    hsv[2] = 1;
  } else if (hsv[2] < 0) {
    hsv[2] = 0;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

export function addHueToRGB(color, offset) {
  const hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
  hsv[0] += offset / 360;
  if (hsv[0] > 1) {
    hsv[0] -= 1;
  } else if (hsv[0] < 0) {
    hsv[0] += 1;
  }
  return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
}

const colorMap = [];
for (let j = 0; j < 256; j += 1) {
  const hex = j.toString(16);
  colorMap[j] = hex.length === 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  if (r < 0) r = 0;

  if (g < 0) g = 0;

  if (b < 0) b = 0;

  return "#" + colorMap[r] + colorMap[g] + colorMap[b];
}

export const getDefaultCurveSegments = () => 150;
