const path = require('path');
const pdfjsLib = require('../pdf.js/build/generic-es5/build/pdf');
global.pdfjsLib = pdfjsLib;
const fs = require('fs');
import { PDDocument } from '../src/pdfbox_emu/PDDocument';
import { PDFTextStripper, runPDFTextStripper } from '../src/pdfbox_emu/PDFTextStripper';
import { PDFGraphicsStreamEngine, runPDFGraphicsStreamEngine } from '../src/pdfbox_emu/PDFGraphicsStreamEngine';
import * as classes from '../src/generated/classes';
import rotRulings from './rulings/outputrotated.json';

global.PDDocument = PDDocument;
global.runPDFTextStripper = runPDFTextStripper;
global.runPDFGraphicsStreamEngine = runPDFGraphicsStreamEngine;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForJDone() {
  for (let i = 0; i < 100; ++i) {
    if (global.done) {
      break;
    }
    await sleep(100);
  }
}

describe('Test JWrap', () => {
  //test('test-doc-load', async () => {
  //  global.done = false;
  //  expect.assertions(1);
  //  var p = classes.main('test-doc-load');
  //  await waitForJDone();
  //  expect(1).toBeTruthy();
  //});

  //test('test-text-stripper', async () => {
  //  global.done = false;
  //  expect.assertions(1);
  //  var p = classes.main('test-text-stripper');
  //  await waitForJDone();
  //  expect(1).toBeTruthy();
  //});

  //test('test-object-extractor', async () => {
  //  global.done = false;

  //  expect.assertions(1);
  //  var p = classes.main('test-object-extractor');
  //  await waitForJDone();
  //  expect(1).toBeTruthy();
  //});

  test('test-rulings', async () => {
   let fpath = path.resolve(__dirname, 'pdfs', 'outputrotated.pdf');
   let testPdfData = new Uint8Array(fs.readFileSync(fpath));
   global.pdfDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
   // console.time('run test-rulings');
   global.done = false;
   global.result = null;

   var p = classes.main('test-rulings');
   await waitForJDone();
   expect(global.result).not.toBeNull();
   const rulings = JSON.parse(global.result);
   expect(rulings.length).toBe(rotRulings.length);
   for (let i = 0; i < rotRulings.length; ++i) {
     expect(rulings[i].x1).toBeCloseTo(rotRulings[i].x1);
     expect(rulings[i].x2).toBeCloseTo(rotRulings[i].x2);
     expect(rulings[i].y1).toBeCloseTo(rotRulings[i].y1);
     expect(rulings[i].y2).toBeCloseTo(rotRulings[i].y2);
   }
   //console.log(rulings);
   // console.timeEnd('run test-rulings');
  });

  //test('test-text-elements', async () => {
  //  // console.time('run test-text-elements');
  //  global.done = false;

  //  expect.assertions(1);
  //  var p = classes.main('test-text-elements');
  //  await waitForJDone();
  //  expect(1).toBeTruthy();
  //  // console.timeEnd('run test-text-elements');
  //});

  test('stub', () => {});

  // test('test-extract-table', async () => {
  //   // console.time('run test-text-elements');
  //   global.done = false;

  //   expect.assertions(1);
  //   var p = classes.main('%8,7,16,42');
  //   await waitForJDone();
  //   expect(1).toBeTruthy();
  //   // console.timeEnd('run test-text-elements');
  // });


  //test('getCropBox', async () => {
  //  const cb = testPage.getCropBox();
  //  expect(cb.getLowerLeftX()).toBe(0.0);

  //  expect(cb.getLowerLeftY()).toBe(0.0);
  //  expect(cb.getUpperRightX()).toBe(612.0);
  //  expect(cb.getUpperRightY()).toBe(792.0);
  //  expect(cb.getHeight()).toBe(792.0);
  //  expect(cb.getWidth()).toBe(612.0);
  //});
});

