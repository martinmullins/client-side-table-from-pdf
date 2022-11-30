/**
 * @jest-environment jsdom
 **/
const path = require('path');
const pdfjsLib = require('../pdf.js/build/generic-es5/build/pdf');
global.pdfjsLib = pdfjsLib;
const fs = require('fs');
import { PDDocument } from '../src/pdfbox_emu/PDDocument';
import { createPDFGraphicsStreamEngine } from '../src/pdfbox_emu/PDFGraphicsStreamEngine';

import opData from './obj/test2.json';
import clipData from './obj/test2-clip.json';
import rotOpData from './obj/outputrotated.json';
import rotClipData from './obj/outputrotated-clip.json';

const { SVGGraphics, OPS } = pdfjsLib;
let PDFGraphicsStreamEngine = createPDFGraphicsStreamEngine(SVGGraphics, OPS);

class TestObjectStream {
  constructor(testList) {
      this.failText = null;
      this.testList = testList;
  }

  checkopFunc(op, fn) {
      if (op == undefined) {
          this.failText = `no more operators`;
          //console.error(this.fail);
          return false;
      }
      if (op.func !== fn) {
          this.failText = `${op.func} !== ${fn}`;
          //console.error(this.fail);
          return false;
      }
      //console.log(op.func, ' == ', fn);
      return this.failText == null;
  }

  checkValue(op, v1, v2, msg) {
      if (!this.failText && (v1 == undefined || v2 == undefined || Math.abs(v1 - v2) > 0.001)) {
          this.failText = `${op.func}, ${v1} !== ${v2}, ${msg}`;
      }
      return this.failText == null;
  }

  appendRectangle(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'appendRectangle')) {
          return;
      }

      this.checkValue(op, op.p0x, p0x, 'p0x');
      this.checkValue(op, op.p0y, p0y, 'p0y');
      this.checkValue(op, op.p1x, p1x, 'p1x');
      this.checkValue(op, op.p1y, p1y, 'p1y');
      this.checkValue(op, op.p2x, p2x, 'p2x');
      this.checkValue(op, op.p2y, p2y, 'p2y');
      this.checkValue(op, op.p3x, p3x, 'p3x');
      this.checkValue(op, op.p3y, p3y, 'p3y');
  }

  clip(windingRule)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'clip')) {
          return;
      }
      this.checkValue(op, op.windingRule, windingRule);
  }

  closePath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'closePath')) {
          return;
      }
  }

  curveTo(x1, y1, x2, y2, x3, y3)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'curveTo')) {
          return;
      }
      this.checkValue(op, op.x1, x1);
      this.checkValue(op, op.y1, y1);
      this.checkValue(op, op.x2, x2);
      this.checkValue(op, op.y2, y2);
      this.checkValue(op, op.x3, x3);
      this.checkValue(op, op.y3, y3);
  }

  drawImage() /*PDImage arg0*/  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'drawImage')) {
          return;
      }
  }

  endPath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'endPath')) {
          return;
      }
  }

  fillAndStrokePath() /*int arg0*/ {
      const op = this.testList.shift();
      if(!this.checkopFunc(op, 'fillAndStrokePath')) {
          return;
      }
  }

  fillPath() /*int arg0*/  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'fillPath')) { 
          return;
      }
  }

  lineTo(x, y) {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'lineTo')) {
          return;
      }
      this.checkValue(op, op.x,x);
      this.checkValue(op, op.y,y);
  }

  moveTo(x, y) {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'moveTo')) {
          return;
      }
      this.checkValue(op, op.x,x);
      this.checkValue(op, op.y,y);
  }

  shadingFill() /*COSName arg0*/ {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'shadingFill')) {
          return;
      }
  }

  strokePath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'strokePath')) {
          return;
      }
  }
}

class TestClipStream {
  constructor(testList) {
      this.failText = null;
      this.testList = testList;
      this.engine = null;
  }
  
  setEngine(engine) {
    this.engine = engine;
  }

  checkopFunc(op, fn) {
      if (op == undefined) {
          this.failText = `no more operators`;
          //console.error(this.fail);
          return false;
      }
      if (op.func !== fn) {
          this.failText = `${op.func} !== ${fn}`;
          //console.error(this.fail);
          return false;
      }
      //console.log(op.func, ' == ', fn);
      return this.failText == null;
  }

  checkValue(op, v1, v2, msg) {
      if (!this.failText && (v1 == undefined || v2 == undefined || Math.abs(v1 - v2) > 0.001)) {
          this.failText = `${op.func}, ${v1} !== ${v2}, ${msg}`;
          console.log('Expect',op,'have',this.engine.getCurrentClipPathArea());
      }
      return this.failText == null;
  }

  checkBox(op) {
    const bbox = this.engine.getCurrentClipPathArea();
    this.checkValue(op, op.x, bbox.x1, 'check x1');
    this.checkValue(op, op.y, bbox.y1, 'check x2');
    this.checkValue(op, op.w, bbox.x2 - bbox.x1, 'check w');
    this.checkValue(op, op.h, bbox.y2 - bbox.y1, 'check h');
  }

  appendRectangle(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'appendRectangle')) {
          return;
      }

      this.checkBox(op);
  }

  clip(windingRule)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'clip')) {
          return;
      }
      this.checkBox(op);
  }

  closePath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'closePath')) {
          return;
      }
      this.checkBox(op);
  }

  curveTo(x1, y1, x2, y2, x3, y3)  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'curveTo')) {
          return;
      }
      this.checkBox(op);
  }

  drawImage() /*PDImage arg0*/  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'drawImage')) {
          return;
      }
      this.checkBox(op);
  }

  endPath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'endPath')) {
          return;
      }
      this.checkBox(op);
  }

  fillAndStrokePath() /*int arg0*/ {
      const op = this.testList.shift();
      if(!this.checkopFunc(op, 'fillAndStrokePath')) {
          return;
      }
      this.checkBox(op);
  }

  fillPath() /*int arg0*/  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'fillPath')) { 
          return;
      }
      this.checkBox(op);
  }

  lineTo(x, y) {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'lineTo')) {
          return;
      }
      this.checkBox(op);
  }

  moveTo(x, y) {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'moveTo')) {
          return;
      }
      this.checkBox(op);
  }

  shadingFill() /*COSName arg0*/ {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'shadingFill')) {
          return;
      }
      this.checkBox(op);
  }

  strokePath()  {
      const op = this.testList.shift();
      if (!this.checkopFunc(op, 'strokePath')) {
          return;
      }
      this.checkBox(op);
  }
}


  //const opList = await page.getOperatorList();
  //const viewport = 
  
  //const objStream = new ObjectStreamEngine(page.commonObjs, page.objs, testStream);
  //objStream.embedFonts = true;
  //expect(objStream).not.toBeUndefined();
  //await objStream.process(opList, viewport);
  //expect(testStream.fail).toBeNull();


var testDoc = null;

describe('PDFGraphicsStreamEngine wrapper functions', () => {
  test('check page viewer rotated', async () => {
    let fpath = path.resolve(__dirname, 'pdfs', 'rotated.pdf');
    let testPdfData = new Uint8Array(fs.readFileSync(fpath));
    global.PDFViewerApplication = { pdfViewer: { pagesRotation: 90 } };
    testDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
    expect.assertions(2);
    const doc = new PDDocument(testDoc);
    const testStream = new TestObjectStream(rotOpData);
    const p = await doc.getPageAsync(1);
    const objStream = new PDFGraphicsStreamEngine(p, testStream);
    expect(objStream).not.toBeUndefined();
    await objStream.processPage();
    expect(testStream.failText).toBeNull();
  });
});


