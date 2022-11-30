import { PDFGraphicsStreamImageEngine } from './img/PDFGraphicsStreamImageEngine';
import { IDENTITY_MATRIX, rotate, applyTransform } from '../util';
const WIND_EVEN_ODD       = 0;
const WIND_NON_ZERO       = 1;

class Element {
    constructor(name) {
        this.children = []
        this.attrs = {}
        this.name = name;
    }

    appendChild(element) {
        this.children.push(element);
    }

    setAttribute(field, value) {
        this.attrs[field] = value;
    }

    setAttributeNS(ns, field, value) {
        this.attrs[field] = value;
    }

    getAttributeNS(ns, field) {
      return "";
    }

    cloneNode() {
        return this;
    }
}

class SVGFactory extends Element {
    constructor(width, height) {
        super('SVGFactory');
        if (width == undefined) {
            this.width = 0;
        }
        if (height == undefined) {
            this.height = 0;
        }
    }

    create(width, height) {
        return new SVGFactory(width, height);
    }

    createElement(s) {
        return new Element(s);
    }
}

export function createPDFGraphicsStreamEngine(SVGGraphics, OPS) {
  return class PDFGraphicsStreamEngine extends SVGGraphics {
    constructor(page, objectStream) {
      super(page.getCommonObjs(), page.getObjs());
      this.viewport = page.getViewport();
      this.rotation = page.getRotation();
      this.currentBbox = {
        x1: null,
        y1: null,
        x2: null,
        y2: null,
      };
      this.page = page;
      this.ignoreEndpath = false;
      this.svgFactory = new SVGFactory();
      this.objectStream = objectStream;
      this.justEndPath = false;
      
    }

    addFontStyle(fontObj) {
      //NO OP //console.log('NOOP');
    }

    async processPage() {
      this.embedFonts = true;
      const operatorList = await this.page.getOperatorList();
      this._initialize(this.viewport);
      await this.loadDependencies(operatorList);
      this.transformMatrix = IDENTITY_MATRIX;
      this.executeOpTree(this.convertOpList(operatorList));
    }

    clip(s) {
      super.clip;
      if (s === 'evenodd') {
        this.objectStream.clip(WIND_EVEN_ODD);
        return;
      } else if (s === 'nonzero') {
        this.objectStream.clip(WIND_NON_ZERO);
        return;
      }
      throw new Error(`Invalid winding=${s}`);
    }

    getCurrentClipPathArea() {
      if (this.justEndPath &&
          this.currentBbox.x1 != null &&
          this.currentBbox.y1 != null &&
          this.currentBbox.x2 != null &&
          this.currentBbox.y2 != null) {
        return this.currentBbox;
      } 

      // looks like view port is returned otherwise
      const [ox, oy] = rotate(this.rotation, this.viewport.offsetX, this.viewport.offsetY);
      const [w, h] = rotate(this.rotation, this.page.getWidth(), this.page.getHeight());
      return { x1: ox, y1: oy, x2: ox + w, y2: Math.abs(oy + h) };
    }

    constructPath(ops, args) {
      super.constructPath(ops, args);
      this.justEndPath = false;
      let x = 0;
      let y = 0;
      let j = 0;
      let xt = 0;
      let yt = 0;

      for (const op of ops) {
        switch (op | 0) {
          case OPS.rectangle:
            x = args[j++];
            y = args[j++];
            [xt,yt] = applyTransform([x,y], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            let width = args[j++];
            let height = args[j++];
            //[width, height] = rotate(this.rotation, width, height);
            const xw = xt + width;
            const yh = yt + height;
            this.updateBbox(xt,yt, xw, yh);
            this.objectStream.appendRectangle(xt, yt, xw, yt, xw, yh, xt, yh);
            break;
          case OPS.moveTo:
            x = args[j++];
            y = args[j++];
            [xt,yt] = applyTransform([x,y], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            this.updateBbox(xt,yt);
            this.objectStream.moveTo(xt, yt);
            break;
          case OPS.lineTo:
            x = args[j++];
            y = args[j++];
            [xt,yt] = applyTransform([x,y], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            this.updateBbox(xt,yt);
            this.objectStream.lineTo(xt, yt);
            break;
          case OPS.curveTo:
            x = args[j + 4];
            y = args[j + 5];
            [xt,yt] = applyTransform([x,y], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            // (x, y); ??
            this.updateBbox(xt,yt);
            this.objectStream.curveTo(
              args[j],
              args[j + 1],
              args[j + 2],
              args[j + 3],
              xt,
              yt
            );
            j += 6;
            break;
          case OPS.curveTo2:
            [xt,yt] = applyTransform([args[j+2],args[j+3]], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            this.updateBbox(xt, yt);
            this.objectStream.curveTo(
              x,
              y,
              args[j],
              args[j + 1],
              args[j + 2],
              args[j + 3]
            );
            x = args[j + 2];
            y = args[j + 3];
            j += 4;
            break;
          case OPS.curveTo3:
            x = args[j + 2];
            y = args[j + 3];
            [xt,yt] = applyTransform([x,y], this.transformMatrix);
            //[xt,yt] = rotate(this.rotation, xt, yt);
            this.updateBbox(xt,yt);
            this.objectStream.curveTo(
              args[j],
              args[j + 1],
              x,
              y,
              x,
              y
            );
            j += 4;
            break;
          case OPS.closePath:
            this.objectStream.closePath();
            break;
        }
      }
    }

    updateBbox(x, y, xw, yh) {
      if (xw !== undefined || yh !== undefined) {
        this.updateBbox(xw, yh);
      }

      const bbox = this.currentBbox;
      if (bbox.x1 == null) {
        this.currentBbox.x1 = x;
        this.currentBbox.y1 = y;
        return;
      }

      if (bbox.x2 == null) {
        if (bbox.x1 > x) {
          let tmp = bbox.x1;
          this.currentBbox.x1 = x;
          this.currentBbox.x2 = tmp;
        } else {
          this.currentBbox.x2 = x;
        }
        if (bbox.y1 > y) {
          let tmp = bbox.y1;
          this.currentBbox.y1 = y;
          this.currentBbox.y2 = tmp;
        } else {
          this.currentBbox.y2 = y;
        }
        return;
      }

      if (x < bbox.x1) {
        this.currentBbox.x1 = x;
      }

      if (x > bbox.x2) {
        this.currentBbox.x2 = x;
      }

      if (y < bbox.y1) {
        this.currentBbox.y1 = y;
      }

      if (y > bbox.y2) {
        this.currentBbox.y2 = y;
      }
    }

    closePath() {
      super.closePath();
      this.objectStream.closePath();
    }

    endPath() {
      this.justEndPath = true;
      if (this.ignoreEndpath) {
        this.ignoreEndpath = false;
      } else {
        this.objectStream.endPath();
      }
      super.endPath();
      this.currentBbox = {
        x1: null,
        y1: null,
        x2: null,
        y2: null,
      };
    }

    fillStroke() {
      super.fillStroke();
      this.objectStream.fillAndStrokePath(0);
    }

    fill() {
      this.ignoreEndpath = true; //PDFBOX?
      super.fill();
      this.objectStream.fillPath(0);
    }

    stroke() {
      this.ignoreEndpath = true; //PDFBOX?
      super.stroke();
      this.objectStream.strokePath();
    }

    shadingFill() {
      super.shadingFill(arg);
      this.objectStream.shadingFill();
    }

    paintImageXObject(arg) {
      super.paintImageXObject(arg);
      this.objectStream.drawImage(null);
    }
  };
}

export function runPDFGraphicsStreamEngine(processor, page, callback) {
  try {
    // console.time('run engine');
    const { SVGGraphics, OPS } = (global ? global : window).pdfjsLib;
    let PDFGraphicsStreamEngine = (global ? global : window).pdfGraphicsStreamEngine;
    if (!PDFGraphicsStreamEngine) {
      PDFGraphicsStreamEngine = createPDFGraphicsStreamEngine(SVGGraphics, OPS);
      (global ? global : window).pdfGraphicsStreamEngine = PDFGraphicsStreamEngine;
    }

    var engine = null;
    if (page.getType() === 'IMG') {
      engine = new PDFGraphicsStreamImageEngine(page, processor);
    } else {
      engine = new PDFGraphicsStreamEngine(page, processor);
    }
    processor.setGraphicsState(engine);
    engine.processPage().then(() => {
        callback('not used');
      })
      .catch((err) => {
        console.error(err);
        callback(err.toString());
      });
    // console.timeEnd('run engine');
  } catch (err) {
    console.error(err);
    callback(err.toString());
  }
}

