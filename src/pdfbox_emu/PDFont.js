
// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
const hashCodeFn = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);

function compareFloat(f1, f2) {
  return Math.abs(f1 - f2) < 0.001;
}

function isZero(f1) {
  return compareFloat(0, f1);
}

export class PDFont {
  constructor(name, style) {
    this.name = name;
    this.style = style;
    this.height = this.calcHeight();
  }

  calcHeight() {
    let font = this.style;
    let capHeight = font.capHeight;
    let ascent = font.ascent * 1000.0;
    let descent = font.descent * 1000.0;
    let glyphHeight = 600; // resonable default?
    if (font.bbox) {
      glyphHeight = (font.bbox[3] - font.bbox[1]) / 2;
    }
    
    
    // sometimes the bbox has very high values, but CapHeight is OK
    if (capHeight != null && !isZero(capHeight) &&
      (capHeight < glyphHeight || isZero(glyphHeight)))
    {
      glyphHeight = capHeight;
    }
    // PDFBOX-3464, PDFBOX-448:
    // sometimes even CapHeight has very high value, but Ascent and Descent are ok
    if (ascent > 0 && descent < 0 &&
      ((ascent - descent) / 2 < glyphHeight || isZero(glyphHeight)))
    {
      glyphHeight = (ascent - descent) / 2;
    }

    // transformPoint from glyph space -> text space
    // TODO Type3Fonts
    //float height;
    //if (font instanceof PDType3Font)
    //{
    //  height = font.getFontMatrix().transformPoint(0, glyphHeight).y;
    //}
    //else
    //{
    var height = glyphHeight / 100;
    //}

    return height;
  }

  getHeight() {
    return this.height;
  }

  getName() {
    return this.name;
  }

  getFamily() {
    return this.style.fontFamily;
  }

  isVertical() {
    return this.style.vertical;
  }

  equals(obj) {
    return obj && obj.getName && (obj.getName() === this.getName());
  }

  hashCode() {
    return hashCodeFn(this.getName());
  }
}