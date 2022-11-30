/**
 * @jest-environment jsdom
 **/
const path = require('path');
const pdfjsLib = require('../pdf.js/build/generic-es5/build/pdf');
const fs = require('fs');
import { PDDocument } from '../src/pdfbox_emu/PDDocument';


describe('PDPage wrapper functions', () => {
  test('simple page', async () => {
    expect.assertions(7);
    let fpath = path.resolve(__dirname, 'pdfs', 'test2.pdf');
    let testPdfData = new Uint8Array(fs.readFileSync(fpath));
    const testDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
    const pddoc = new PDDocument(testDoc);
    const testPage = await pddoc.getPageAsync(1);
    expect(testPage.getRotation()).toBe(0);
    const cb = testPage.getCropBox();
    expect(cb.getLowerLeftX()).toBe(0.0);
    expect(cb.getLowerLeftY()).toBe(0.0);
    expect(cb.getUpperRightX()).toBe(612.0);
    expect(cb.getUpperRightY()).toBe(792.0);
    expect(cb.getHeight()).toBe(792.0);
    expect(cb.getWidth()).toBe(612.0);
  });

  test('internally rotated page', async () => {
    expect.assertions(7);
    let fpath = path.resolve(__dirname, 'pdfs', 'outputrotated.pdf');
    let testPdfData = new Uint8Array(fs.readFileSync(fpath));
    const testDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
    const pddoc = new PDDocument(testDoc);
    const testPage = await pddoc.getPageAsync(1);
    expect(testPage.getRotation()).toBe(90);
    const cb = testPage.getCropBox();
    expect(cb.getLowerLeftX()).toBe(0.0);
    expect(cb.getLowerLeftY()).toBe(0.0);
    expect(cb.getUpperRightX()).toBe(612.0);
    expect(cb.getUpperRightY()).toBe(792.0);
    expect(cb.getHeight()).toBe(792.0);
    expect(cb.getWidth()).toBe(612.0);
  });
});
