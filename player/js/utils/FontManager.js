import getFontProperties from "./getFontProperties";
import createNS from "./helpers/svg_elements";

const maxWaitingTime = 5000;
const emptyChar = {
  w: 0,
  size: 0,
  shapes: [],
  data: {
    shapes: [],
  },
};
let combinedCharacters = [];
// Hindi characters
combinedCharacters = combinedCharacters.concat([
  2304, 2305, 2306, 2307, 2362, 2363, 2364, 2364, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373,
  2374, 2375, 2376, 2377, 2378, 2379, 2380, 2381, 2382, 2383, 2387, 2388, 2389, 2390, 2391, 2402,
  2403,
]);

const surrogateModifiers = ["d83cdffb", "d83cdffc", "d83cdffd", "d83cdffe", "d83cdfff"];

const zeroWidthJoiner = [65039, 8205];

function trimFontOptions(font) {
  const familyArray = font.split(",");
  const enabledFamilies = [];
  for (const family of familyArray) {
    if (family !== "sans-serif" && family !== "monospace") enabledFamilies.push(family);
  }

  return enabledFamilies.join(",");
}

function setUpNode(font, family) {
  const parentNode = document.createElement("span");
  // Node is invisible to screen readers.
  parentNode.setAttribute("aria-hidden", true);
  parentNode.style.fontFamily = family;
  const node = document.createElement("span");
  // Characters that vary significantly among different fonts
  node.innerText = "giItT1WQy@!-/#";
  // Visible - so we can measure it - but not on the screen
  parentNode.style.position = "absolute";
  parentNode.style.left = "-10000px";
  parentNode.style.top = "-10000px";
  // Large font size makes even subtle changes obvious
  parentNode.style.fontSize = "300px";
  // Reset any font properties
  parentNode.style.fontVariant = "normal";
  parentNode.style.fontStyle = "normal";
  parentNode.style.fontWeight = "normal";
  parentNode.style.letterSpacing = "0";
  parentNode.appendChild(node);
  document.body.appendChild(parentNode);

  // Remember width with no applied web font
  const width = node.offsetWidth;
  node.style.fontFamily = trimFontOptions(font) + ", " + family;
  return { node, w: width, parent: parentNode };
}

function checkLoadedFonts() {
  let loadedCount = this.fonts.length;
  for (const font of this.fonts) {
    if (font.loaded) {
      loadedCount -= 1;
    } else if (font.fOrigin === "n" || font.origin === 0) {
      font.loaded = true;
    } else {
      let node = font.monoCase.node;
      let w = font.monoCase.w;
      if (node.offsetWidth !== w) {
        loadedCount -= 1;
        font.loaded = true;
      } else {
        node = font.sansCase.node;
        w = font.sansCase.w;
        if (node.offsetWidth !== w) {
          loadedCount -= 1;
          font.loaded = true;
        }
      }
      if (font.loaded) {
        font.sansCase.parent.parentNode.removeChild(font.sansCase.parent);
        font.monoCase.parent.parentNode.removeChild(font.monoCase.parent);
      }
    }
  }

  if (loadedCount !== 0 && Date.now() - this.initTime < maxWaitingTime) {
    setTimeout(this.checkLoadedFontsBinded, 20);
  } else {
    setTimeout(this.setIsLoadedBinded, 10);
  }
}

function createHelper(fontData, def) {
  const engine = document.body && def ? "svg" : "canvas";
  let helper;
  const fontProps = getFontProperties(fontData);
  if (engine === "svg") {
    const tHelper = createNS("text");
    tHelper.style.fontSize = "100px";
    // tHelper.style.fontFamily = fontData.fFamily;
    tHelper.setAttribute("font-family", fontData.fFamily);
    tHelper.setAttribute("font-style", fontProps.style);
    tHelper.setAttribute("font-weight", fontProps.weight);
    tHelper.textContent = "1";
    if (fontData.fClass) {
      tHelper.style.fontFamily = "inherit";
      tHelper.setAttribute("class", fontData.fClass);
    } else {
      tHelper.style.fontFamily = fontData.fFamily;
    }
    def.appendChild(tHelper);
    helper = tHelper;
  } else {
    const tCanvasHelper = new OffscreenCanvas(500, 500).getContext("2d");
    tCanvasHelper.font = fontProps.style + " " + fontProps.weight + " 100px " + fontData.fFamily;
    helper = tCanvasHelper;
  }
  function measure(text) {
    if (engine === "svg") {
      helper.textContent = text;
      return helper.getComputedTextLength();
    }
    return helper.measureText(text).width;
  }
  return {
    measureText: measure,
  };
}

function addFonts(fontData, defs) {
  if (!fontData) {
    this.isLoaded = true;
    return;
  }
  if (this.chars) {
    this.isLoaded = true;
    this.fonts = fontData.list;
    return;
  }
  if (!document.body) {
    this.isLoaded = true;
    fontData.list.forEach(data => {
      data.helper = createHelper(data);
      data.cache = {};
    });
    this.fonts = fontData.list;
    return;
  }

  const fontArr = fontData.list;
  let _pendingFonts = fontArr.length;
  for (const font of fontArr) {
    let shouldLoadFont = true;
    let loadedSelector;
    font.loaded = false;
    font.monoCase = setUpNode(font.fFamily, "monospace");
    font.sansCase = setUpNode(font.fFamily, "sans-serif");
    if (!font.fPath) {
      font.loaded = true;
      _pendingFonts -= 1;
    } else if (font.fOrigin === "p" || font.origin === 3) {
      loadedSelector = document.querySelectorAll(
        'style[f-forigin="p"][f-family="' +
          font.fFamily +
          '"], style[f-origin="3"][f-family="' +
          font.fFamily +
          '"]',
      );

      if (loadedSelector.length > 0) {
        shouldLoadFont = false;
      }

      if (shouldLoadFont) {
        const s = document.createElement("style");
        s.setAttribute("f-forigin", font.fOrigin);
        s.setAttribute("f-origin", font.origin);
        s.setAttribute("f-family", font.fFamily);
        s.type = "text/css";
        s.innerText =
          "@font-face {font-family: " +
          font.fFamily +
          "; font-style: normal; src: url('" +
          font.fPath +
          "');}";
        defs.appendChild(s);
      }
    } else if (font.fOrigin === "g" || font.origin === 1) {
      loadedSelector = document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]');

      for (let j = 0; j < loadedSelector.length; j += 1) {
        if (loadedSelector[j].href.indexOf(font.fPath) !== -1) {
          // Font is already loaded
          shouldLoadFont = false;
        }
      }

      if (shouldLoadFont) {
        const l = document.createElement("link");
        l.setAttribute("f-forigin", font.fOrigin);
        l.setAttribute("f-origin", font.origin);
        l.type = "text/css";
        l.rel = "stylesheet";
        l.href = font.fPath;
        document.body.appendChild(l);
      }
    } else if (font.fOrigin === "t" || font.origin === 2) {
      loadedSelector = document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]');

      for (let j = 0; j < loadedSelector.length; j += 1) {
        // Font is already loaded
        if (font.fPath === loadedSelector[j].src) shouldLoadFont = false;
      }

      if (shouldLoadFont) {
        const sc = document.createElement("link");
        sc.setAttribute("f-forigin", font.fOrigin);
        sc.setAttribute("f-origin", font.origin);
        sc.setAttribute("rel", "stylesheet");
        sc.setAttribute("href", font.fPath);
        defs.appendChild(sc);
      }
    }
    font.helper = createHelper(font, defs);
    font.cache = {};
    this.fonts.push(font);
  }
  if (_pendingFonts === 0) {
    this.isLoaded = true;
  } else {
    // On some cases even if the font is loaded, it won't load correctly when measuring text on canvas.
    // Adding this timeout seems to fix it
    setTimeout(this.checkLoadedFonts.bind(this), 100);
  }
}

function addChars(chars) {
  if (!chars) return;

  if (!this.chars) this.chars = [];

  let jLen = this.chars.length;
  for (let i = 0; i < chars.length; i += 1) {
    let found = false;
    let j = 0;
    while (j < jLen) {
      if (
        this.chars[j].style === chars[i].style &&
        this.chars[j].fFamily === chars[i].fFamily &&
        this.chars[j].ch === chars[i].ch
      ) {
        found = true;
      }
      j += 1;
    }
    if (!found) {
      this.chars.push(chars[i]);
      jLen += 1;
    }
  }
}

function getCharData(char, style, font) {
  for (const thisChar of this.chars) {
    if (thisChar.ch === char && thisChar.style === style && thisChar.fFamily === font) {
      return thisChar;
    }
  }
  if (
    ((typeof char === "string" && char.charCodeAt(0) !== 13) || !char) &&
    console &&
    console.warn && // eslint-disable-line no-console
    !this._warned
  ) {
    this._warned = true;
    console.warn("Missing character from exported characters list: ", char, style, font); // eslint-disable-line no-console
  }
  return emptyChar;
}

function measureText(char, fontName, size) {
  const fontData = this.getFontByName(fontName);
  const index = char.charCodeAt(0);
  if (!fontData.cache[index + 1]) {
    const tHelper = fontData.helper;
    if (char === " ") {
      const doubleSize = tHelper.measureText("|" + char + "|");
      const singleSize = tHelper.measureText("||");
      fontData.cache[index + 1] = (doubleSize - singleSize) / 100;
    } else {
      fontData.cache[index + 1] = tHelper.measureText(char) / 100;
    }
  }
  return fontData.cache[index + 1] * size;
}

function getFontByName(name) {
  let i = 0;
  const len = this.fonts.length;
  while (i < len) {
    if (this.fonts[i].fName === name) return this.fonts[i];

    i += 1;
  }
  return this.fonts[0];
}

function isModifier(firstCharCode, secondCharCode) {
  const sum = firstCharCode.toString(16) + secondCharCode.toString(16);
  return surrogateModifiers.indexOf(sum) !== -1;
}

function isZeroWidthJoiner(firstCharCode, secondCharCode) {
  if (!secondCharCode) return firstCharCode === zeroWidthJoiner[1];

  return firstCharCode === zeroWidthJoiner[0] && secondCharCode === zeroWidthJoiner[1];
}

function isCombinedCharacter(char) {
  return combinedCharacters.indexOf(char) !== -1;
}

function setIsLoaded() {
  this.isLoaded = true;
}

const Font = function () {
  this.fonts = [];
  this.chars = null;
  this.typekitLoaded = 0;
  this.isLoaded = false;
  this._warned = false;
  this.initTime = Date.now();
  this.setIsLoadedBinded = this.setIsLoaded.bind(this);
  this.checkLoadedFontsBinded = this.checkLoadedFonts.bind(this);
};
Font.isModifier = isModifier;
Font.isZeroWidthJoiner = isZeroWidthJoiner;
Font.isCombinedCharacter = isCombinedCharacter;

const fontPrototype = {
  addChars,
  addFonts,
  getCharData,
  getFontByName,
  measureText,
  checkLoadedFonts,
  setIsLoaded,
};

Font.prototype = fontPrototype;

export default Font;
