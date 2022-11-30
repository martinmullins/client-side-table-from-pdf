import { PDPage } from '../PDPage';
//import * as cv from '../../opencv';
//import * as Tesseract from 'tesseract.js';
import * as Tesseract from 'tesseract.js/dist/tesseract.min.js';
import * as tata from 'tata-js';

const { createWorker } = Tesseract;

const HIDE_DEBUG = true;

var cvReady = false;

const fetchOpenCv = async () => {
  tata.info('Loading scanner', '', { position: 'bm', holding: true, progress: true });
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'opencv.js';


  const done = await new Promise((resolve, reject) => {
    script.addEventListener('load', () => {
      window.cv['onRuntimeInitialized'] = () => {
        cvReady = true;
        resolve(true);
        tata.clear();
        tata.info('Scanner has loaded', '', { position: 'bm', holding: true });
      };
    });

    script.addEventListener('error', (err) => {
      reject('failed to load open cv');
      reject(err);
      tata.clear();
      tata.error('Failed', 'Issues loading scanner tool.', { position: 'bm', holding: true });
    });

    document.body.appendChild(script);
  }).catch(console.error);

  return done;
};


function posToRect(p, pw, ph) {
  if (p.length < 3) {
    console.error('invalid selection range');
  }
  
  let posV = pos.map(({x,y}) => {
    return {x: x*pw, y: y*ph };
  });

  let x = posV[0].x; 
  let y = posV[0].y; 
  let width = posV[1].x - posV[0].x;
  let height = posV[2].y - posV[0].y;
  return { x,  y, width, height };
}


export class PDPageImg extends PDPage {
  constructor(page, method) {
    super(page, method);
    this.type = 'IMG';
    this.fetchImage = this.fetchImage.bind(this);
    this.getText = this.getText.bind(this);
    this.textContent = {
      items: [],
      styles: {}
    };
    this.lines = {};
    this.scale = 3.0;
  }

  async getTextContent() {
    return  this.textContent;
  }

  async fetchImage() {
    console.time('pdf-img');
    if (!cvReady) {
       let res = await fetchOpenCv();
       if (!res || !cv) {
         console.error('NO OPEN CV?');
         return;
       }
    }

    var uport = this.page.getViewport({ scale: 1.0 });
    var ubox = posToRect(window.pos, uport.width, uport.height);
    const scale = this.scale;
    const offsetX = -ubox.x * scale;
    const offsetY = -ubox.y * scale;
    var viewport = this.page.getViewport({ scale,  offsetX, offsetY});
    var selectionBox = posToRect(window.pos, viewport.width, viewport.height);
    viewport.width = selectionBox.width;
    viewport.height = selectionBox.height;

    //
    // Prepare canvas using PDF page dimensions
    //
    var canvas = document.getElementById('debug-canvas');
    if (HIDE_DEBUG) {
      canvas.style.display = 'none';
    }
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    console.log('>>>>>', canvas.height, canvas.width);

    //
    // Render PDF page into canvas context
    //
    await this.page.render({ canvasContext: context, viewport: viewport }).promise;
    let src = cv.imread('debug-canvas');
    cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);
    this.lines = await this.getLines(src.clone()); // do i need the await?
    src = cv.imread('debug-canvas');
    cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);

    if (this.method === 'n') {
      const tr = this.getTextRegions(src.clone(), this.lines.horizLines, this.lines.vertLines);
      this.lines = {};
      this.textContent = await this.getText(context, tr, scale, ubox.x, ubox.y, uport.width, uport.height, this.method === 'n');
    } else {
      this.textContent = await this.getText(context, this.lines.textRegions, scale, ubox.x, ubox.y, uport.width, uport.height, this.method === 'n');
    }
    ////this.textContent = await this.getText(context, tr, scale, ubox.x, ubox.y, uport.width, uport.height);

    this.offx = ubox.x;
    this.offy = ubox.y;
    //console.log('TEXT CONTENT IS ', this.textContent);
    src.delete();
    console.timeEnd('pdf-img');
  }

  getTextRegions(src, hlines, vlines) {
    const thresholdSrc = src;
    const white = new cv.Scalar(255,255,255);

    const lines = hlines.concat(vlines);
    for (let line of lines) {
      cv.rectangle(thresholdSrc, new cv.Point(line.x, line.y), new cv.Point(line.x + line.width, line.y + line.height), white, cv.FILLED);
    }

    let graySrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.cvtColor(thresholdSrc, graySrc, cv.COLOR_RGBA2GRAY);
    let binSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.threshold(graySrc, binSrc, 125, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    // morph
    let morphSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    let element = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5*this.scale, 3*this.scale) );
    cv.morphologyEx(binSrc, morphSrc, cv.MORPH_CLOSE, element); //Does the trick

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(morphSrc, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    //////cv::findContours(img_threshold, contours, 0, 1); 
    const textRegions = [];
    const padX = this.scale * 1.8;
    const padY = this.scale * 0.5;
    for (let i = 0; i < contours.size(); ++i) {
      const rect = cv.boundingRect(contours.get(i));
      // grow each region slightly
      rect.x -= padX;
      rect.width += 2*padX;
      rect.y -= padY;
      rect.height += 2*padY;
      const { x,y,width, height} = rect;
      textRegions.push(rect);
      //cv.rectangle(binSrc, new cv.Point(x, y), new cv.Point(x + width, y + height), new cv.Scalar(255, 0, 255), 2);
    }

    // push source without rectangles !IMPORTANT
    cv.imshow('debug-canvas', thresholdSrc);

    graySrc.delete();
    binSrc.delete();
    //thresholdSrc.delete();
    morphSrc.delete();
    contours.delete();
    hierarchy.delete();

    return textRegions;
  }

  buildItem(word, scale) {
    const item = {};
    if (word.direction == "LEFT_TO_RIGHT" || word.direction === "NEUTRAL") {
      item.ltr = 'ltr';
    } else {
      console.error(`TODO, unhandled direction "${word.direction}"`);
    }

    item.fontName = 'default'; // TODO word.font_name ? word.font_name : 'default';
    item.width = (word.bbox.x1 - word.bbox.x0)/scale;
    item.height = (word.bbox.y1 - word.bbox.y0)/scale;
    item.str = word.text.replace(/\s+$/,'');
    item.transform = [0,0,0,0,0,0];
    item.glyphs = [];
    return item;
  }

  buildGlyph(word, symbol, spaceWidth, scale, offx, offy, pagewidth, pageheight) {
    const sx = symbol.bbox.x0;
    const sy = symbol.bbox.y0;
    const sw = symbol.bbox.x1 - symbol.bbox.x0;
    const sh = symbol.bbox.y1 - symbol.bbox.y0;

    const glyph = {};
    glyph.fontMatrix = [0,0,0,0,0,0]; //not used
    glyph.fontSize = sh/scale;
    glyph.fontSizeInPt = Math.ceil(sh/scale);
    glyph.height = sh/scale;
    glyph.isVertical = false;
    glyph.textMatrix = [0,0,0,0,0,0]; // notused
    glyph.unicode = symbol.text.replace(/\s+$/,'');
    glyph.width = sw/scale;
    glyph.widthOfSpace = spaceWidth;
    glyph.x = sx/scale + offx;
    glyph.y = Math.abs(pageheight - (sy/scale + offy + glyph.height));

    return glyph;
  }

  async getText(context, textRegions, scale, offx, offy, pagewidth, pageheight, isNonLine) {
    if (textRegions.length === 0) {
      return undefined;
    }

    const tworker = createWorker({
      workerPath: `${document.baseURI}/tesseract-dist/worker.min.js`,
      langPath: `${document.baseURI}/lang-data`,
      corePath: `${document.baseURI}/tesseract/tesseract-core.wasm.js`,
      cacheMethod: 'none', // on edge indexedDB was not working :(
      //logger: m => console.log('TESSERACT', m),
      logger: m => {},
    });
    let lang = 'eng';
    if (window.imageLang) {
      lang = window.imageLang;
    }

    await tworker.load();
    await tworker.loadLanguage(lang);
    await tworker.initialize(lang);
    await tworker.setParameters({
      'tessjs_create_tsv': '0',
      'tessjs_create_hocr': '0',
      'tessedit_pageseg_mode': Tesseract.PSM.SINGLE_BLOCK
    });

    const canvas = document.createElement('canvas');
    canvas.style.position = "absolute";
    canvas.style.top = "500px";
    canvas.style.right = "30px";
    if (HIDE_DEBUG) {
      canvas.style.display = 'none';
    }
    document.body.appendChild(canvas);

    const textContent = { items: [] };
    for (const tr of textRegions) {
      if (isNonLine) {
        tr.x -= 2*this.scale;
        tr.width += 4*this.scale;
        tr.height += this.scale;
      }
      const srcData = context.getImageData(tr.x, tr.y, tr.width, tr.height);
      canvas.width = tr.width;
      canvas.height = tr.height
      const ctx = canvas.getContext('2d');
      ctx.putImageData(srcData, 0, 0);

      let src = cv.imread(canvas);
      // gray sacle
      let graySrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
      cv.cvtColor(src, graySrc, cv.COLOR_RGBA2GRAY);

      // binary image
      let binSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
      cv.threshold(graySrc, binSrc, 125, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
      if (!isNonLine) {
        cv.rectangle(binSrc, new cv.Point(0,0), new cv.Point(canvas.width, canvas.height), new cv.Scalar(255,255,255), 3);
      }
      cv.imshow(canvas, binSrc);
      //cv.imshow('debug-canvas', binSrc);

      const result = await tworker.recognize(canvas);
      if (result.data.text) {
        //console.log(word.text);
        let wordDist = -1;
        if (result.data.lines) {
          for (const line of result.data.lines) {
            if (line.words.length > 1) {


              const lineWords = line.words;
              const bboxWords = lineWords.map(w => {
                return w.bbox;
              });

              var lx1 = 0;
              const dists = bboxWords.map((w) => {
                if (lx1) {
                  const dist = w.x0 - lx1;
                  lx1 = w.x1;
                  return dist;
                } else {
                  lx1 = w.x1;
                  return 0;
                }
              }).slice(1);
              if (dists.length > 0) {

                const medianPos = Math.floor(dists.length / 2);
                let median = dists[medianPos];
                if (dists.length % 2 === 0) {
                  median = (median + dists[medianPos - 1]) / 2.0;
                }
                wordDist = median / scale;
                console.log('DISTS', line.text, wordDist);

              }
            }

            for (const word of line.words) {
              console.log(word.text);

              word.bbox.x0 += tr.x;
              word.bbox.y0 += tr.y;
              word.bbox.x1 += tr.x;
              word.bbox.y1 += tr.y;

              const wx = word.bbox.x0;
              const wy = word.bbox.y0;
              const ww = word.bbox.x1 - word.bbox.x0;
              const wh = word.bbox.y1 - word.bbox.y0;

              const item = this.buildItem(word, scale);

              ctx.font = `${wh}px Aria`;
              let spaceWidth = ctx.measureText(' ').width / scale;
              if (wordDist !== -1) {
                spaceWidth = wordDist < spaceWidth * 4 ? wordDist : spaceWidth;
              }
              console.log(word.text, spaceWidth);
              //context.strokeStyle = 'black';
              //context.beginPath();
              //context.rect(wx, wy, ww, wh);
              //context.stroke();

              let colSw = 0;
              let lastX1 = 0;
              let lastX0 = 0;
              for (let i = 0; i < word.symbols.length; ++i) {
                const s = word.symbols[i];
                // console.log('    ::', s.text);
                // console.dir(s);
                const textWidth = ctx.measureText(s.text).width;

                //if (lastX1 > s.bbox.x0) {
                //  s.bbox.x0 = lastX1;
                //  //if (s.bbox.x1 - s.bbox.x0 <= 3) {
                //  //  if (i + 1 < word.symbols.length) {
                //  //    let snext = word.symbols[i+1];
                //  //    let nextWidth = snext.bbox.x1 - snext.bbox.x0;
                //  //    s.bbox.x1 += nextWidth/2;
                //  //    snext.bbox.x0 = s.bbox.x1;
                //  //  }
                //  //}
                //}
                if (lastX1 > 0) {
                  s.bbox.x0 = lastX1; //Math.min(s.bbox.x0, lastX1);
                }
                s.bbox.x1 = Math.max(textWidth + s.bbox.x0, s.bbox.x1);
                lastX1 = s.bbox.x1;


                //let snext = undefined;
                //let nextWidth = 0;
                //if (i + 1 < word.symbols.length) {
                //  snext = word.symbols[i+1];
                //  nextWidth = snext.bbox.x1 - snext.bbox.x0;
                //}

                //// account for bbox starting to far to the left 
                //let width = s.bbox.x1 - s.bbox.x0;

                //if (width <= 3 && nextWidth && snext) { // bug with tesseract?
                //  snext.bbox.x0 += nextWidth / 2;
                //  s.bbox.x1 = s.bbox.x0 + nextWidth / 2;
                //}

                s.bbox.x0 += tr.x;
                s.bbox.y0 = word.bbox.y0;
                s.bbox.x1 += tr.x; //s.bbox.x0 + textWidth;
                s.bbox.y1 = word.bbox.y1;

                item.glyphs.push(this.buildGlyph(word, s, spaceWidth, scale, offx, offy, pagewidth, pageheight));

                //context.strokeStyle = colSw % 2 === 0 ? 'orange' : 'purple';
                //context.beginPath();
                //const sx = s.bbox.x0;
                //const sy = s.bbox.y0;
                //const sw = s.bbox.x1 - s.bbox.x0;
                //const sh = s.bbox.y1 - s.bbox.y0;
                //context.rect(sx, sy, sw, sh);
                //context.stroke();
                //colSw += 1;
              }

              textContent.items.push(item);
            }
          }
        }

        
      }
    }

    textContent.styles = {
      'default': {
        ascent: 0,
        bbox: [0, 0, 0, 0],
        capHeight: undefined,
        descent: 0,
        fontFamily: "sans-serif",
        vertical: false
      }
    };

    //console.log('DONE DONE DONE');
    //console.log('offx', offx);
    //console.log('offy', offy);
    //console.log('pw', pagewidth);
    //console.log('ph', pageheight);
    //console.dir(textContent);
    await tworker.terminate();
    
    //console.log('symbols');
    //console.dir(result.data.symbols);
    //await tworker.terminate();

    document.body.removeChild(canvas);
    return textContent;
  }

  async getLines(src) {
    // gray sacle
    let graySrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.cvtColor(src, graySrc, cv.COLOR_RGBA2GRAY);

    // binary image
    let binSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.threshold(graySrc, binSrc, 200, 255, cv.THRESH_BINARY_INV);
  
    // swapped bin
    let swapBinSrc =  cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.bitwise_not(binSrc, swapBinSrc);

    const hklen = Math.max(10,Math.ceil(src.cols/100.0));
    const vklen = Math.max(10,Math.ceil(src.rows/100.0));
    const textklen = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5,3));

    // invert required parts
    let binMask =  binSrc.clone();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.erode(binMask, binMask, textklen, new cv.Point(-1,-1), 3);
    cv.dilate(binMask, binMask, textklen, new cv.Point(-1,-1), 3);
    cv.findContours(binMask, contours, hierarchy, cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
    //console.log('COUNTOURS CCCCCC', contours.size());
    for (let i = 0; i < contours.size(); ++i) {
      cv.drawContours(binMask, contours, i, new cv.Scalar(255,255,255), -1);
    }
    cv.bitwise_not(binSrc, binSrc, binMask);
    cv.bitwise_not(src, src, binMask);
    for (let i = 0; i < contours.size(); ++i) {
      const rect = cv.boundingRect(contours.get(i));
      let { x,y, width, height} = rect;
      cv.rectangle(binSrc, new cv.Point(x, y), new cv.Point(x + width - 1, y + height - 1), new cv.Scalar(255,255,255), 1);
    }

    // kernel length
    //console.log('KLEN is', vklen, hklen);
    const vkernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1,vklen));
    const hkernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(hklen,1));
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2,2));

    // detect vertical lins
    let vSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.erode(binSrc, vSrc, vkernel, new cv.Point(-1,-1), 3);
    cv.dilate(vSrc, vSrc, vkernel, new cv.Point(-1,-1), 3);

    // detect horizontal lins
    let hSrc = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
    cv.erode(binSrc, hSrc, hkernel, new cv.Point(-1,-1), 3);
    cv.dilate(hSrc, hSrc, hkernel, new cv.Point(-1,-1), 3);

    // account for movement
    const ht = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, -hklen/4, 0, 1, 0]);
    const vt = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, 0, 0, 1, -vklen/4]);
    cv.warpAffine(hSrc, hSrc, ht, hSrc.size());
    cv.warpAffine(vSrc, vSrc, vt, vSrc.size());

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    const horizLines = [];
    cv.findContours(hSrc, contours, hierarchy, cv.RETR_EXTERNAL,cv.CHAIN_APPROX_NONE)
    for (let i = 0; i < contours.size(); ++i) {
      const rect = cv.boundingRect(contours.get(i));
      let { x,y,width, height} = rect;
      width += hklen/2;
      horizLines.push(rect);
      //cv.rectangle(src, new cv.Point(x, y), new cv.Point(x + width, y + height), new cv.Scalar(255,0,0), 1);
    }

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(vSrc, contours, hierarchy, cv.RETR_EXTERNAL,cv.CHAIN_APPROX_NONE)
    const vertLines = [];
    for (let i = 0; i < contours.size(); ++i) {
      const rect = cv.boundingRect(contours.get(i));
      let { x,y,width, height} = rect;
      height += vklen/2;
      vertLines.push(rect);
      //cv.rectangle(src, new cv.Point(x, y), new cv.Point(x + width, y + height), new cv.Scalar(0,0,255), 1);
    }

    const combined  = new cv.Mat();
    cv.add(hSrc, vSrc, combined);

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(combined, contours, hierarchy, cv.RETR_TREE,cv.CHAIN_APPROX_SIMPLE, new cv.Point(0,0));
    //console.log('CONTOURS ARE', contours.size());
    const srcArea = combined.rows * combined.cols;
    const textRegions = [];
    for (let i = 0; i < contours.size(); ++i) {
      const rect = cv.boundingRect(contours.get(i));
      let { x,y,width, height} = rect;
      const area = width * height;
      let col = i % 2 == 0 ? new cv.Scalar(255,0,0) : new cv.Scalar(0,0,255);
      if (area/srcArea > 0.30) {
        col = new cv.Scalar(0, 255, 0);
      } else {
        textRegions.push(rect); // EW
      }
      //cv.rectangle(src, new cv.Point(x, y), new cv.Point(x + width, y + height), col, 2);
    }

    // joints
    const joints = new cv.Mat();
    cv.bitwise_and(hSrc, vSrc, joints);

    // draw src with rectangles
    // leave this as it is important to have the inverted picture
    // as the source for text extraction
    cv.imshow('debug-canvas', src);
    src.delete();
    graySrc.delete();
    binSrc.delete();
    binMask.delete();
    swapBinSrc.delete();
    vSrc.delete();
    hSrc.delete();
    combined.delete();
    joints.delete();

    return { horizLines, vertLines, textRegions};
  }
}