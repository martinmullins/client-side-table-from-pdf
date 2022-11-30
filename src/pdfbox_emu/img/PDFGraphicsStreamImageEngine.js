import { rotate } from '../../util';
export class PDFGraphicsStreamImageEngine {
  constructor(page, objectStream) {
    this.viewport = page.getViewport();
    this.rotation = page.getRotation();
    this.currentBbox = {
      x1: null,
      y1: null,
      x2: null,
      y2: null,
    };
    this.page = page;
    this.objectStream = objectStream;

  }

  async processPage() {
    if (this.page.method === 'n') {
      return;
    }
    // we need to extract the image
    // run the opencv tool get the the lines
    // call objectStream.moveTo, lineTo, startPath, endPath etc
    // we call this.objectStream functions for the
    console.log('!LINES ARE', this.page.lines);
    var uport = this.page.getViewport({ scale: 1.0 });
    const offx = this.page.offx;
    const offy = this.page.offy;
    const scale = this.page.scale;
    let svg = `<svg style="position: absolute; top: 0; right: 0; z-index: 999;" width="${uport.width}px" height="${uport.height}px">\n`;
    for (const v of this.page.lines.vertLines) {
      const strokeWidth = Math.max(v.width/scale, 1);
      const x0 = (v.x/scale) + offx;
      const yStart = (v.y/scale) + offy;
      const y0 = Math.abs(uport.height - yStart);
      const x1 = x0;
      const y1 = Math.abs(uport.height - (yStart + (v.height/scale)));
      svg += `<path d="M ${x0} ${y0} L ${x1} ${y1}" stroke="red" fill="black" />`;
      this.objectStream.moveTo(x0, y0);
      this.objectStream.lineTo(x1, y1);
      this.objectStream.strokePath();
      this.objectStream.endPath();
    }
    for (const h of this.page.lines.horizLines) {
      const strokeWidth = Math.max(h.height/scale, 1);
      const x0 = (h.x/scale) + offx;
      const y0 = Math.abs(uport.height - (h.y/scale + offy));
      const x1 = x0 + (h.width/scale);
      const y1 = y0;
      svg += `<path d="M ${x0} ${y0} L ${x1} ${y1}" stroke="blue" fill="black" />`;
      this.objectStream.moveTo(x0, y0);
      this.objectStream.lineTo(x1, y1);
      this.objectStream.strokePath();
      this.objectStream.endPath();
    }
    svg += `</svg>`;
    //const pageDiv = document.querySelector("div.page[data-page-number='1']");
    //pageDiv.insertAdjacentHTML('afterbegin',svg);
  }

  getCurrentClipPathArea() {
    const [ox, oy] = rotate(this.rotation, this.viewport.offsetX, this.viewport.offsetY);
    const [w, h] = rotate(this.rotation, this.page.getWidth(), this.page.getHeight());
    return { x1: ox, y1: oy, x2: ox + w, y2: Math.abs(oy + h) };
  }
}