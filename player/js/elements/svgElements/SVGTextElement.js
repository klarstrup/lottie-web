import { extendPrototype } from "../../utils/functionExtensions";
import { createSizedArray } from "../../utils/helpers/arrays";
import createNS from "../../utils/helpers/svg_elements";
import BaseElement from "../BaseElement";
import FrameElement from "../helpers/FrameElement";
import HierarchyElement from "../helpers/HierarchyElement";
import RenderableDOMElement from "../helpers/RenderableDOMElement";
import TransformElement from "../helpers/TransformElement";
import ITextElement from "../TextElement";
import SVGBaseElement from "./SVGBaseElement";
import SVGCompElement from "./SVGCompElement"; // eslint-disable-line
import SVGShapeElement from "./SVGShapeElement";

const emptyShapeData = {
  shapes: [],
};

function SVGTextLottieElement(data, globalData, comp) {
  this.textSpans = [];
  this.renderType = "svg";
  this.initElement(data, globalData, comp);
}

extendPrototype(
  [
    BaseElement,
    TransformElement,
    SVGBaseElement,
    HierarchyElement,
    FrameElement,
    RenderableDOMElement,
    ITextElement,
  ],
  SVGTextLottieElement,
);

SVGTextLottieElement.prototype.createContent = function () {
  if (this.data.singleShape && !this.globalData.fontManager.chars) {
    this.textContainer = createNS("text");
  }
};

SVGTextLottieElement.prototype.buildTextContents = function (textArray) {
  let i = 0;
  const len = textArray.length;
  const textContents = [];
  let currentTextContent = "";
  while (i < len) {
    if (textArray[i] === String.fromCharCode(13) || textArray[i] === String.fromCharCode(3)) {
      textContents.push(currentTextContent);
      currentTextContent = "";
    } else {
      currentTextContent += textArray[i];
    }
    i += 1;
  }
  textContents.push(currentTextContent);
  return textContents;
};

SVGTextLottieElement.prototype.buildShapeData = function (data, scale) {
  // data should probably be cloned to apply scale separately to each instance of a text on different layers
  // but since text internal content gets only rendered once and then it's never rerendered,
  // it's probably safe not to clone data and reuse always the same instance even if the object is mutated.
  // Avoiding cloning is preferred since cloning each character shape data is expensive
  if (data.shapes && data.shapes.length) {
    const shape = data.shapes[0];
    if (shape.it) {
      const shapeItem = shape.it[shape.it.length - 1];
      if (shapeItem.s) {
        shapeItem.s.k[0] = scale;
        shapeItem.s.k[1] = scale;
      }
    }
  }
  return data;
};

SVGTextLottieElement.prototype.buildNewText = function () {
  this.addDynamicProperty(this);

  const documentData = this.textProperty.currentData;
  this.renderedLetters = createSizedArray(documentData ? documentData.l.length : 0);
  if (documentData.fc) {
    this.layerElement.setAttribute("fill", this.buildColor(documentData.fc));
  } else {
    this.layerElement.setAttribute("fill", "rgba(0,0,0,0)");
  }
  if (documentData.sc) {
    this.layerElement.setAttribute("stroke", this.buildColor(documentData.sc));
    this.layerElement.setAttribute("stroke-width", documentData.sw);
  }
  this.layerElement.setAttribute("font-size", documentData.finalSize);
  const fontData = this.globalData.fontManager.getFontByName(documentData.f);
  if (fontData.fClass) {
    this.layerElement.setAttribute("class", fontData.fClass);
  } else {
    this.layerElement.setAttribute("font-family", fontData.fFamily);
    const fWeight = documentData.fWeight;
    const fStyle = documentData.fStyle;
    this.layerElement.setAttribute("font-style", fStyle);
    this.layerElement.setAttribute("font-weight", fWeight);
  }
  this.layerElement.setAttribute("aria-label", documentData.t);

  const letters = documentData.l || [];
  const usesGlyphs = !!this.globalData.fontManager.chars;

  const matrixHelper = this.mHelper;
  const shapeStr = "";
  const singleShape = this.data.singleShape;
  let xPos = 0;
  let yPos = 0;
  let firstLine = true;
  const trackingOffset = documentData.tr * 0.001 * documentData.finalSize;
  if (singleShape && !usesGlyphs && !documentData.sz) {
    const tElement = this.textContainer;
    let justify = "start";
    switch (documentData.j) {
      case 1:
        justify = "end";
        break;
      case 2:
        justify = "middle";
        break;
      default:
        justify = "start";
        break;
    }
    tElement.setAttribute("text-anchor", justify);
    tElement.setAttribute("letter-spacing", trackingOffset);
    const textContent = this.buildTextContents(documentData.finalText);

    yPos = documentData.ps ? documentData.ps[1] + documentData.ascent : 0;
    for (let i = 0; i < textContent.length; i += 1) {
      const tSpan = this.textSpans[i].span || createNS("tspan");
      tSpan.textContent = textContent[i];
      tSpan.setAttribute("x", 0);
      tSpan.setAttribute("y", yPos);
      tSpan.style.display = "inherit";
      tElement.appendChild(tSpan);
      if (!this.textSpans[i]) {
        this.textSpans[i] = {
          span: null,
          glyph: null,
        };
      }
      this.textSpans[i].span = tSpan;
      yPos += documentData.finalLineHeight;
    }

    this.layerElement.appendChild(tElement);
  } else {
    const cachedSpansLength = this.textSpans.length;
    let charData;
    for (let i = 0; i < textContent.length; i += 1) {
      if (!this.textSpans[i]) this.textSpans[i] = { span: null, childSpan: null, glyph: null };

      if (!usesGlyphs || !singleShape || i === 0) {
        const tSpan =
          cachedSpansLength > i ? this.textSpans[i].span : createNS(usesGlyphs ? "g" : "text");
        if (cachedSpansLength <= i) {
          tSpan.setAttribute("stroke-linecap", "butt");
          tSpan.setAttribute("stroke-linejoin", "round");
          tSpan.setAttribute("stroke-miterlimit", "4");
          this.textSpans[i].span = tSpan;
          if (usesGlyphs) {
            const childSpan = createNS("g");
            tSpan.appendChild(childSpan);
            this.textSpans[i].childSpan = childSpan;
          }
          this.textSpans[i].span = tSpan;
          this.layerElement.appendChild(tSpan);
        }
        tSpan.style.display = "inherit";
      }

      matrixHelper.reset();
      if (singleShape) {
        if (letters[i].n) {
          xPos = -trackingOffset;
          yPos += documentData.yOffset;
          yPos += firstLine ? 1 : 0;
          firstLine = false;
        }
        this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i].line, xPos, yPos);
        xPos += letters[i].l || 0;
        // xPos += letters[i].val === ' ' ? 0 : trackingOffset;
        xPos += trackingOffset;
      }
      if (usesGlyphs) {
        charData = this.globalData.fontManager.getCharData(
          documentData.finalText[i],
          fontData.fStyle,
          this.globalData.fontManager.getFontByName(documentData.f).fFamily,
        );
        let glyphElement;
        // t === 1 means the character has been replaced with an animated shaped
        if (charData.t === 1) {
          glyphElement = new SVGCompElement(charData.data, this.globalData, this);
        } else {
          let data = emptyShapeData;
          if (charData.data && charData.data.shapes) {
            data = this.buildShapeData(charData.data, documentData.finalSize);
          }
          glyphElement = new SVGShapeElement(data, this.globalData, this);
        }
        if (this.textSpans[i].glyph) {
          const glyph = this.textSpans[i].glyph;
          this.textSpans[i].childSpan.removeChild(glyph.layerElement);
          glyph.destroy();
        }
        this.textSpans[i].glyph = glyphElement;
        glyphElement._debug = true;
        glyphElement.prepareFrame(0);
        glyphElement.renderFrame();
        this.textSpans[i].childSpan.appendChild(glyphElement.layerElement);
        // when using animated shapes, the layer will be scaled instead of replacing the internal scale
        // this might have issues with strokes and might need a different solution
        if (charData.t === 1) {
          this.textSpans[i].childSpan.setAttribute(
            "transform",
            "scale(" + documentData.finalSize / 100 + "," + documentData.finalSize / 100 + ")",
          );
        }
      } else {
        if (singleShape) {
          tSpan.setAttribute(
            "transform",
            "translate(" + matrixHelper.props[12] + "," + matrixHelper.props[13] + ")",
          );
        }
        tSpan.textContent = letters[i].val;
        tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
      }
      //
    }
    if (singleShape && tSpan) {
      tSpan.setAttribute("d", shapeStr);
    }
  }
  let i = 0;
  while (i < this.textSpans.length) {
    this.textSpans[i].span.style.display = "none";
    i += 1;
  }

  this._sizeChanged = true;
};

SVGTextLottieElement.prototype.sourceRectAtTime = function () {
  this.prepareFrame(this.comp.renderedFrame - this.data.st);
  this.renderInnerContent();
  if (this._sizeChanged) {
    this._sizeChanged = false;
    const textBox = this.layerElement.getBBox();
    this.bbox = {
      top: textBox.y,
      left: textBox.x,
      width: textBox.width,
      height: textBox.height,
    };
  }
  return this.bbox;
};

SVGTextLottieElement.prototype.getValue = function () {
  this.renderedFrame = this.comp.renderedFrame;
  for (const { glyph } of this.textSpans) {
    if (glyph) {
      glyph.prepareFrame(this.comp.renderedFrame - this.data.st);
      if (glyph._mdf) this._mdf = true;
    }
  }
};

SVGTextLottieElement.prototype.renderInnerContent = function () {
  if (!this.data.singleShape || this._mdf) {
    this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
    if (this.lettersChangedFlag || this.textAnimator.lettersChangedFlag) {
      this._sizeChanged = true;
      const renderedLetters = this.textAnimator.renderedLetters;

      const letters = this.textProperty.currentData.l;

      for (let i = 0; i < letters.length; i += 1) {
        if (!letters[i].n) {
          const renderedLetter = renderedLetters[i];
          const textSpan = this.textSpans[i].span;
          const glyphElement = this.textSpans[i].glyph;
          if (glyphElement) glyphElement.renderFrame();

          if (renderedLetter._mdf.m) {
            textSpan.setAttribute("transform", renderedLetter.m);
          }
          if (renderedLetter._mdf.o) {
            textSpan.setAttribute("opacity", renderedLetter.o);
          }
          if (renderedLetter._mdf.sw) {
            textSpan.setAttribute("stroke-width", renderedLetter.sw);
          }
          if (renderedLetter._mdf.sc) {
            textSpan.setAttribute("stroke", renderedLetter.sc);
          }
          if (renderedLetter._mdf.fc) {
            textSpan.setAttribute("fill", renderedLetter.fc);
          }
        }
      }
    }
  }
};

export default SVGTextLottieElement;
