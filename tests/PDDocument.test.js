/**
 * @jest-environment jsdom
 **/
const path = require('path');
const pdfjsLib = require('../pdf.js/build/generic-es5/build/pdf');
const fs = require('fs');
import { PDDocument } from '../src/pdfbox_emu/PDDocument';

var testDoc = null;

beforeAll(async () => {
  let fpath = path.resolve(__dirname, 'pdfs', 'test2.pdf');
  let testPdfData = new Uint8Array(fs.readFileSync(fpath));
  testDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
});

describe('PDDocument wrapper functions', () => {
  test('getNumberOfPages', () => {
    const pddoc = new PDDocument(testDoc);
    expect(pddoc).toBeTruthy();
    expect(pddoc.getNumberOfPages()).toBe(1);
  });

  test('getPage', async () => {
    expect.assertions(2);
    const pddoc = new PDDocument(testDoc);
    expect(pddoc).toBeTruthy();
    const page = await pddoc.getPageAsync(1);
    expect(page.page).toBeTruthy();
  });
});
