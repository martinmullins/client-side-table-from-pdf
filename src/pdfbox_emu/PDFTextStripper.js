import { TextPosition } from './TextPosition';
import { PDFont } from './PDFont';

export class PDFTextStripper {

  constructor() { 
    this.doOnce = true;
  }

  async getTextAsync(processor, doc, startIndex, endIndex) {
    this.doc = doc;
    this.startIndex = startIndex;
    if (startIndex <= 0) {
      throw new Error(`Invalid startIndex=${startIndex}`);
    }
    this.endIndex = endIndex;
    if (endIndex > this.doc.getNumberOfPages()) {
      throw new Error(`Invalid endIndex=${endIndex}, total=${this.doc.getNumberOfPages()}`);
    }
    this.processor = processor;
    for (let idx = this.startIndex; idx <= this.endIndex; ++idx) {
      await this.getTextForPage(idx);
    }
  }

  async getTextForPage(idx) {
    const page = await this.doc.getPageAsync(idx);
    if (page == undefined) {
      throw new Error(`Cannot get page for idx=${idx}`);
    }
    const vp = page.getViewport();
    const viewH = vp.viewBox[3];
    const content = await page.getTextContent();
    if (content == undefined) {
      return;
    }
    //console.log('TEXT CONTENT');
    //console.dir(content);

    const pdfonts = {};
    for (let styleName of Object.keys(content.styles)) {
      let style = content.styles[styleName];
      pdfonts[styleName] = new PDFont(styleName, style);
    }

    const pageRotation = page.getRotation();

    for (let item of content.items) {
      if (this.doOnce) {
        //console.log('GLYPH: ', item.glyphs[0]);
        //throw new Error();
      }
      const textPositions = item.glyphs.map(g => {
        let dir = 0;
        var a = item.transform[0];
        var b = item.transform[1];
        var c = item.transform[2];
        var d = item.transform[3];
        if (b > 0 && c < 0) {
          dir = 90;
        }
        if (b < 0 && c > 0) {
          dir = 270;
        }
        if (a < 0 && d < 0 && c == 0 && b ==0) {
          dir = 180;
        }
        let font = pdfonts[item.fontName];
        return new TextPosition(g, font, dir, pageRotation, viewH);
      });
      const str = item.str;
      this.processor.writeStringJS(str, textPositions);
      //console.log(str, textPositions);
    }
  }
  
}

export function runPDFTextStripper(processor, doc, startIndex, endIndex, callback) {
  try {
    var textStripper = new PDFTextStripper();
    return textStripper.getTextAsync(processor, doc, startIndex, endIndex)
      .then(() => {
        callback('not used');
      })
      .catch((err) => {
        console.error(err);
        callback(err.toString());
      });
  } catch (err) {
    console.error(err);
    callback(err.toString());
  }
}

