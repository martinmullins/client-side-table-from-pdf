import { IDENTITY_MATRIX, rotate, applyTransform } from '../util';

export class TextPosition {
  constructor(glyph, font, dir, pageRotation, viewH) {
    this.pageRotation = pageRotation;
    this.dir = dir;
    this.rotation = (pageRotation + dir) % 360;
    this.font = font;
    this.viewH = viewH;
    this.x = glyph.x;
    this.y = glyph.y;
    this.width = glyph.width;
    this.fontSize = glyph.fontSize;
    this.fontSizeInPt = glyph.fontSizeInPt;
    this.isVertical = glyph.isVertical;
    this.unicode = glyph.unicode;
    this.widthOfSpace = glyph.widthOfSpace;
    this.height = glyph.height;

    //if (glyph.unicode === "S") {
    //  console.log(glyph.isVertical);
  
    //  //var textPosition = this;
    //  //console.log("getUnicode", glyph.unicode);
    //  //console.log("getX", textPosition.getX());
    //  //console.log("getY", textPosition.getY());
    //  //console.log("getXDirAdj", textPosition.getXDirAdj());
    //  //console.log("getYDirAdj",  textPosition.getYDirAdj());
    //  //console.log("getWidth",  textPosition.getWidth());
    //  //console.log("getHeight",  textPosition.getHeight());
    //  //console.log("getWidthDirAdj",  textPosition.getWidthDirAdj());
    //  //console.log("getHeightDir",  textPosition.getHeightDir());
    //  //console.log("getFontSize",  textPosition.getFontSize());
    //  //console.log("getFontSizeInPt",  textPosition.getFontSizeInPt());
    //  //console.log("getDir",  textPosition.getDir());
    //  //console.log("getWidthOfSpace",textPosition.getWidthOfSpace());
    //  //console.log("");
    //  //console.log("");
    //  //console.log("");
    //}
  }

  getRotation() {
    return this.pageRotation;
  }

  getFont() {
    return this.font;
  }

  getUnicode() {
    return this.unicode;
  }

  getX() {
    const [x,y] = rotate(this.pageRotation, this.x,this.y);
    return x;
  }

  getY() {
    //return this.y;
    //const [x,y] = rotate(this.pageRotation, [this.x,this.y]);
    const [x,y] = rotate(this.pageRotation, this.x,this.y);
    if (y < 0) {
      return -y;
    } else {
      return this.viewH - y;
    }
  }

  getXDirAdj() {
    const [x,y] = rotate(this.dir, this.x,this.y);
    return x;
  }

  getYDirAdj() {
    //return this.y;
    //const [x,y] = rotate(this.pageRotation, [this.x,this.y]);
    const [x,y] = rotate(this.dir, this.x,this.y);
    if (y < 0) {
      return -y;
    } else {
      return this.viewH - y;
    }
  }

  getHeight() {
    const [w,h] = rotate(this.dir, this.width, this.height);
    return h;
  }

  getHeightDir() {
    const [w,h] = rotate(this.dir, this.width, this.height);
    return h;
  }

  getWidth() {
    const [w,h] = rotate(this.dir, this.width, this.height);
    return w;
  }

  getWidthDirAdj() {
    const [w,h] = rotate(this.dir, this.width, this.height);
    return w;
  }

  getWidthOfSpace() {
    return Math.abs(this.widthOfSpace);
  }

  getFontSize() {
    return this.fontSize;
  }

  getFontSizeInPt() {
    return Math.round(this.fontSizeInPt);
  }

  getFontObj() {
    return this.font;
  }

  getDir() {
    return this.dir;
  }
}