import { PDPage } from './PDPage';
import { PDPageImg } from './img/PDPageImg';

export class PDDocument {
  constructor(doc) {
    this.doc = null;
    if (doc == undefined) {
      throw new Error('Pdfjs doc undefined');
    }

    this.doc = doc;
    this.lastPage = null;
    this.lastMode = null;
  }

  getNumberOfPages() {
    return this.doc.numPages;
  }

  async getPageAsync(idx) {
    const g = global ? global : window;
    if (g.docMode === this.lastMode && this.lastPage && this.lastPage.getPageNumber() === idx) {
      return this.lastPage;
    }

    let page;
    try {
      page = await this.doc.getPage(idx);
    } catch (e) {
      console.error(e);
      return null;
    }
    console.log('page',  page.pageNumber);

    const method = g.method;

    if (g && g.docMode === 'IMG') {
      this.lastPage = new PDPageImg(page, method);
      this.lastMode = 'IMG';
      await this.lastPage.fetchImage();
      return this.lastPage;
    }

    this.lastPage = new PDPage(page, method);
    this.lastMode = 'DOC';
    return this.lastPage;
  }
}
