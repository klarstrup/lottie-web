import AnimationItem from "./AnimationItem";

var registeredAnimations: AnimationItem[] = [];
var initTime = 0;
var len = 0;
var playingAnimationsNum = 0;
var _stopped = true;
var _isFrozen = false;

function removeElement(ev: { target: AnimationItem }) {
  let i = 0;
  const animItem = ev.target;
  while (i < len) {
    if (registeredAnimations[i] === animItem) {
      registeredAnimations.splice(i, 1);
      i -= 1;
      len -= 1;
      if (!animItem.isPaused) subtractPlayingCount();
    }
    i += 1;
  }
}

function addPlayingCount() {
  playingAnimationsNum += 1;
  activate();
}

function subtractPlayingCount() {
  playingAnimationsNum -= 1;
}

export function loadAnimation(params: Parameters<AnimationItem["setParams"]>[0]) {
  var animItem = new AnimationItem();
  animItem.addEventListener("destroy", removeElement);
  animItem.addEventListener("_active", addPlayingCount);
  animItem.addEventListener("_idle", subtractPlayingCount);
  registeredAnimations.push(animItem);
  len += 1;
  animItem.setParams(params);
  return animItem;
}

function resume(nowTime: DOMHighResTimeStamp) {
  const elapsedTime = nowTime - initTime;
  for (let i = 0; i < len; i += 1) {
    registeredAnimations[i]?.advanceTime(elapsedTime);
  }
  initTime = nowTime;
  if (playingAnimationsNum && !_isFrozen) {
    window.requestAnimationFrame(resume);
  } else {
    _stopped = true;
  }
}

function first(nowTime: DOMHighResTimeStamp) {
  initTime = nowTime;
  window.requestAnimationFrame(resume);
}

function activate() {
  if (!_isFrozen && playingAnimationsNum && _stopped) {
    window.requestAnimationFrame(first);
    _stopped = false;
  }
}
