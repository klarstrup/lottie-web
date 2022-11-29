import FontManager from "../FontManager";
import getFontProperties from "../getFontProperties";

function TextProperty(elem, data) {
  this._frameId = -999999;
  this.pv = "";
  this.v = "";
  this.kf = false;
  this._isFirstFrame = true;
  this._mdf = false;
  this.data = data;
  this.elem = elem;
  this.comp = this.elem.comp;
  this.keysIndex = 0;
  this.canResize = false;
  this.minimumFontSize = 1;
  this.effectsSequence = [];
  this.currentData = {
    ascent: 0,
    boxWidth: this.defaultBoxWidth,
    f: "",
    fStyle: "",
    fWeight: "",
    fc: "",
    j: "",
    justifyOffset: "",
    l: [],
    lh: 0,
    lineWidths: [],
    ls: "",
    of: "",
    s: "",
    sc: "",
    sw: 0,
    t: 0,
    tr: 0,
    sz: 0,
    ps: null,
    fillColorAnim: false,
    strokeColorAnim: false,
    strokeWidthAnim: false,
    yOffset: 0,
    finalSize: 0,
    finalText: [],
    finalLineHeight: 0,
    __complete: false,
  };
  this.copyData(this.currentData, this.data.d.k[0].s);

  if (!this.searchProperty()) {
    this.completeTextData(this.currentData);
  }
}

TextProperty.prototype.defaultBoxWidth = [0, 0];

TextProperty.prototype.copyData = function (obj, data) {
  for (const s in data) if (Object.prototype.hasOwnProperty.call(data, s)) obj[s] = data[s];

  return obj;
};

TextProperty.prototype.setCurrentData = function (data) {
  if (!data.__complete) {
    this.completeTextData(data);
  }
  this.currentData = data;
  this.currentData.boxWidth = this.currentData.boxWidth || this.defaultBoxWidth;
  this._mdf = true;
};

TextProperty.prototype.searchProperty = function () {
  return this.searchKeyframes();
};

TextProperty.prototype.searchKeyframes = function () {
  this.kf = this.data.d.k.length > 1;
  if (this.kf) {
    this.addEffect(this.getKeyframeValue.bind(this));
  }
  return this.kf;
};

TextProperty.prototype.addEffect = function (effectFunction) {
  this.effectsSequence.push(effectFunction);
  this.elem.addDynamicProperty(this);
};

TextProperty.prototype.getValue = function (_finalValue) {
  if (
    (this.elem.globalData.frameId === this.frameId || !this.effectsSequence.length) &&
    !_finalValue
  ) {
    return;
  }
  this.currentData.t = this.data.d.k[this.keysIndex].s.t;
  const currentValue = this.currentData;
  const currentIndex = this.keysIndex;
  if (this.lock) {
    this.setCurrentData(this.currentData);
    return;
  }
  this.lock = true;
  this._mdf = false;

  let finalValue = _finalValue || this.data.d.k[this.keysIndex].s;
  for (const sequence of this.effectsSequence) {
    // Checking if index changed to prevent creating a new object every time the expression updates.
    if (currentIndex !== this.keysIndex) {
      finalValue = sequence(finalValue, finalValue.t);
    } else {
      finalValue = sequence(this.currentData, finalValue.t);
    }
  }
  if (currentValue !== finalValue) {
    this.setCurrentData(finalValue);
  }
  this.v = this.currentData;
  this.pv = this.v;
  this.lock = false;
  this.frameId = this.elem.globalData.frameId;
};

TextProperty.prototype.getKeyframeValue = function () {
  const textKeys = this.data.d.k;
  const frameNum = this.elem.comp.renderedFrame;
  let i = 0;
  const len = textKeys.length;
  while (i <= len - 1) {
    if (i === len - 1 || textKeys[i + 1].t > frameNum) {
      break;
    }
    i += 1;
  }
  if (this.keysIndex !== i) {
    this.keysIndex = i;
  }
  return this.data.d.k[this.keysIndex].s;
};

TextProperty.prototype.buildFinalText = function (text) {
  const charactersArray = [];
  let i = 0;
  const len = text.length;
  let charCode;
  let secondCharCode;
  let shouldCombine = false;
  while (i < len) {
    charCode = text.charCodeAt(i);
    if (FontManager.isCombinedCharacter(charCode)) {
      charactersArray[charactersArray.length - 1] += text.charAt(i);
    } else if (charCode >= 0xd800 && charCode <= 0xdbff) {
      secondCharCode = text.charCodeAt(i + 1);
      if (secondCharCode >= 0xdc00 && secondCharCode <= 0xdfff) {
        if (shouldCombine || FontManager.isModifier(charCode, secondCharCode)) {
          charactersArray[charactersArray.length - 1] += text.substr(i, 2);
          shouldCombine = false;
        } else {
          charactersArray.push(text.substr(i, 2));
        }
        i += 1;
      } else {
        charactersArray.push(text.charAt(i));
      }
    } else if (charCode > 0xdbff) {
      secondCharCode = text.charCodeAt(i + 1);
      if (FontManager.isZeroWidthJoiner(charCode, secondCharCode)) {
        shouldCombine = true;
        charactersArray[charactersArray.length - 1] += text.substr(i, 2);
        i += 1;
      } else {
        charactersArray.push(text.charAt(i));
      }
    } else if (FontManager.isZeroWidthJoiner(charCode)) {
      charactersArray[charactersArray.length - 1] += text.charAt(i);
      shouldCombine = true;
    } else {
      charactersArray.push(text.charAt(i));
    }
    i += 1;
  }
  return charactersArray;
};

TextProperty.prototype.completeTextData = function (documentData) {
  documentData.__complete = true;
  const fontManager = this.elem.globalData.fontManager;
  const data = this.data;
  const letters = [];
  let len;
  let newLineFlag;
  let index = 0;
  let val;
  const anchorGrouping = data.m.g;
  let currentSize = 0;
  let currentPos = 0;
  let currentLine = 0;
  const lineWidths = [];
  let lineWidth = 0;
  let maxLineWidth = 0;
  let j;
  const fontData = fontManager.getFontByName(documentData.f);
  let charData;
  let cLength = 0;

  const fontProps = getFontProperties(fontData);
  documentData.fWeight = fontProps.weight;
  documentData.fStyle = fontProps.style;
  documentData.finalSize = documentData.s;
  documentData.finalText = this.buildFinalText(documentData.t);
  len = documentData.finalText.length;
  documentData.finalLineHeight = documentData.lh;
  let trackingOffset = (documentData.tr / 1000) * documentData.finalSize;
  let charCode;
  if (documentData.sz) {
    let flag = true;
    const boxWidth = documentData.sz[0];
    const boxHeight = documentData.sz[1];
    let currentHeight;
    let finalText;
    while (flag) {
      finalText = this.buildFinalText(documentData.t);
      currentHeight = 0;
      lineWidth = 0;
      len = finalText.length;
      trackingOffset = (documentData.tr / 1000) * documentData.finalSize;
      let lastSpaceIndex = -1;
      for (let i = 0; i < len; i += 1) {
        charCode = finalText[i].charCodeAt(0);
        newLineFlag = false;
        if (finalText[i] === " ") {
          lastSpaceIndex = i;
        } else if (charCode === 13 || charCode === 3) {
          lineWidth = 0;
          newLineFlag = true;
          currentHeight += documentData.finalLineHeight || documentData.finalSize * 1.2;
        }
        if (fontManager.chars) {
          charData = fontManager.getCharData(finalText[i], fontData.fStyle, fontData.fFamily);
          cLength = newLineFlag ? 0 : (charData.w * documentData.finalSize) / 100;
        } else {
          // tCanvasHelper.font = documentData.s + 'px '+ fontData.fFamily;
          cLength = fontManager.measureText(finalText[i], documentData.f, documentData.finalSize);
        }
        if (lineWidth + cLength > boxWidth && finalText[i] !== " ") {
          if (lastSpaceIndex === -1) {
            len += 1;
          } else {
            i = lastSpaceIndex;
          }
          currentHeight += documentData.finalLineHeight || documentData.finalSize * 1.2;
          finalText.splice(i, lastSpaceIndex === i ? 1 : 0, "\r");
          // finalText = finalText.substr(0,i) + "\r" + finalText.substr(i === lastSpaceIndex ? i + 1 : i);
          lastSpaceIndex = -1;
          lineWidth = 0;
        } else {
          lineWidth += cLength;
          lineWidth += trackingOffset;
        }
      }
      currentHeight += (fontData.ascent * documentData.finalSize) / 100;
      if (
        this.canResize &&
        documentData.finalSize > this.minimumFontSize &&
        boxHeight < currentHeight
      ) {
        documentData.finalSize -= 1;
        documentData.finalLineHeight = (documentData.finalSize * documentData.lh) / documentData.s;
      } else {
        documentData.finalText = finalText;
        len = documentData.finalText.length;
        flag = false;
      }
    }
  }
  lineWidth = -trackingOffset;
  cLength = 0;
  let uncollapsedSpaces = 0;
  let currentChar;
  for (let i = 0; i < len; i += 1) {
    newLineFlag = false;
    currentChar = documentData.finalText[i];
    charCode = currentChar.charCodeAt(0);
    if (charCode === 13 || charCode === 3) {
      uncollapsedSpaces = 0;
      lineWidths.push(lineWidth);
      maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
      lineWidth = -2 * trackingOffset;
      val = "";
      newLineFlag = true;
      currentLine += 1;
    } else {
      val = currentChar;
    }
    if (fontManager.chars) {
      charData = fontManager.getCharData(
        currentChar,
        fontData.fStyle,
        fontManager.getFontByName(documentData.f).fFamily,
      );
      cLength = newLineFlag ? 0 : (charData.w * documentData.finalSize) / 100;
    } else {
      // var charWidth = fontManager.measureText(val, documentData.f, documentData.finalSize);
      // tCanvasHelper.font = documentData.finalSize + 'px '+ fontManager.getFontByName(documentData.f).fFamily;
      cLength = fontManager.measureText(val, documentData.f, documentData.finalSize);
    }

    //
    if (currentChar === " ") {
      uncollapsedSpaces += cLength + trackingOffset;
    } else {
      lineWidth += cLength + trackingOffset + uncollapsedSpaces;
      uncollapsedSpaces = 0;
    }
    letters.push({
      l: cLength,
      an: cLength,
      add: currentSize,
      n: newLineFlag,
      anIndexes: [],
      val,
      line: currentLine,
      animatorJustifyOffset: 0,
    });
    if (anchorGrouping == 2) {
      // eslint-disable-line eqeqeq
      currentSize += cLength;
      if (val === "" || val === " " || i === len - 1) {
        if (val === "" || val === " ") {
          currentSize -= cLength;
        }
        while (currentPos <= i) {
          letters[currentPos].an = currentSize;
          letters[currentPos].ind = index;
          letters[currentPos].extra = cLength;
          currentPos += 1;
        }
        index += 1;
        currentSize = 0;
      }
    } else if (anchorGrouping == 3) {
      // eslint-disable-line eqeqeq
      currentSize += cLength;
      if (val === "" || i === len - 1) {
        if (val === "") {
          currentSize -= cLength;
        }
        while (currentPos <= i) {
          letters[currentPos].an = currentSize;
          letters[currentPos].ind = index;
          letters[currentPos].extra = cLength;
          currentPos += 1;
        }
        currentSize = 0;
        index += 1;
      }
    } else {
      letters[index].ind = index;
      letters[index].extra = 0;
      index += 1;
    }
  }
  documentData.l = letters;
  maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
  lineWidths.push(lineWidth);
  if (documentData.sz) {
    documentData.boxWidth = documentData.sz[0];
    documentData.justifyOffset = 0;
  } else {
    documentData.boxWidth = maxLineWidth;
    switch (documentData.j) {
      case 1:
        documentData.justifyOffset = -documentData.boxWidth;
        break;
      case 2:
        documentData.justifyOffset = -documentData.boxWidth / 2;
        break;
      default:
        documentData.justifyOffset = 0;
    }
  }
  documentData.lineWidths = lineWidths;

  const animators = data.a;
  let based;
  let ind;
  const indexes = [];
  for (const animatorData of animators) {
    if (animatorData.a.sc) documentData.strokeColorAnim = true;

    if (animatorData.a.sw) documentData.strokeWidthAnim = true;

    if (animatorData.a.fc || animatorData.a.fh || animatorData.a.fs || animatorData.a.fb) {
      documentData.fillColorAnim = true;
    }
    ind = 0;
    based = animatorData.s.b;
    for (let i = 0; i < len; i += 1) {
      const letterData = letters[i];
      letterData.anIndexes[j] = ind;
      if (
        (based == 1 && letterData.val !== "") ||
        (based == 2 && letterData.val !== "" && letterData.val !== " ") ||
        (based == 3 && (letterData.n || letterData.val == " " || i == len - 1)) ||
        (based == 4 && (letterData.n || i == len - 1))
      ) {
        if (animatorData.s.rn === 1) indexes.push(ind);

        ind += 1;
      }
    }
    data.a[j].s.totalChars = ind;
    let currentInd = -1;
    let newInd;
    if (animatorData.s.rn === 1) {
      for (let i = 0; i < len; i += 1) {
        const letterData = letters[i];
        if (currentInd != letterData.anIndexes[j]) {
          currentInd = letterData.anIndexes[j];
          newInd = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
        }
        letterData.anIndexes[j] = newInd;
      }
    }
  }
  documentData.yOffset = documentData.finalLineHeight || documentData.finalSize * 1.2;
  documentData.ls = documentData.ls || 0;
  documentData.ascent = (fontData.ascent * documentData.finalSize) / 100;
};

TextProperty.prototype.updateDocumentData = function (newData, index) {
  index = index === undefined ? this.keysIndex : index;
  let dData = this.copyData({}, this.data.d.k[index].s);
  dData = this.copyData(dData, newData);
  this.data.d.k[index].s = dData;
  this.recalculate(index);
  this.elem.addDynamicProperty(this);
};

TextProperty.prototype.recalculate = function (index) {
  const dData = this.data.d.k[index].s;
  dData.__complete = false;
  this.keysIndex = 0;
  this._isFirstFrame = true;
  this.getValue(dData);
};

TextProperty.prototype.canResizeFont = function (_canResize) {
  this.canResize = _canResize;
  this.recalculate(this.keysIndex);
  this.elem.addDynamicProperty(this);
};

TextProperty.prototype.setMinimumFontSize = function (_fontValue) {
  this.minimumFontSize = Math.floor(_fontValue) || 1;
  this.recalculate(this.keysIndex);
  this.elem.addDynamicProperty(this);
};

export default TextProperty;
