import { rotate } from '../util';
import { PDRectangle } from './PDRectangle';

export class PDPage {
  constructor(page, method) {
    this.page = page;
    this.method = method;
    this.type = 'DOC';
    console.log('>> width is', this.getViewport().width);
    console.log('>> height is', this.getViewport().height);
  }

  getType() {
    return this.type;
  }

  getViewport() {
    return this.page.getViewport({ scale: 1.0 });
  }

  getHeight() {
    let { width, height } = this.getViewport();
    [width, height ] = rotate(this.getViewerRotation(), width, height);
    return Math.abs(height);
  }
  
  getWidth() {
    let { width, height } = this.getViewport();
    [width, height ] = rotate(this.getViewerRotation(), width, height);
    return width;
  }

  getCropBox() {
    return new PDRectangle(this.page._pageInfo.view);
  }

  getViewerRotation() {
    const g = global ? global : window;
    if (g && g.PDFViewerApplication && g.PDFViewerApplication.pdfViewer) {
      return g.PDFViewerApplication.pdfViewer.pagesRotation;
    }
    return 0;
  }

  getPageRotation() {
    return this.page.rotate;
  }

  getRotation() {
    const rot = (this.getPageRotation() + this.getViewerRotation()) % 360;
    return rot;
  }

  async getTextContent() {
    return await this.page.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: true
    });
  }
  async getOperatorList() {
    return await this.page.getOperatorList();
  }

  getCommonObjs() {
    return this.page.commonObjs;
  }

  getObjs() {
    return this.page.objs;
  }

  getPageNumber() {
    return this.page.pageNumber;
  }

  //var vp = null; return window.pdfDocument.getPage(p).then((pg) => { vp = pg.getViewport(); return pg.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: true }); }).then(content => { callback(content.items.map(item => { return new TextWrapper(item, content.styles, vp); })); });")
  //  return new PDPage(page);
  //vp = pg.getViewport();
  //  let vp = null; 
  //  getPage(p).then((pg) => {  return ; }).then(content => { callback(content.items.map(item => { return new TextWrapper(item, content.styles, vp); })); });")
  //}
}