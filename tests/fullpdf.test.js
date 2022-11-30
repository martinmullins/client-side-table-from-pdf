const path = require('path');
const pdfjsLib = require('../pdf.js/build/generic-es5/build/pdf');
global.pdfjsLib = pdfjsLib;
const fs = require('fs');
import { PDDocument } from '../src/pdfbox_emu/PDDocument';
import { runPDFTextStripper } from '../src/pdfbox_emu/PDFTextStripper';
import { runPDFGraphicsStreamEngine } from '../src/pdfbox_emu/PDFGraphicsStreamEngine';
import * as classes from '../src/generated/classes';
import testsList from './tests.json'

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

function ignoreEmptyLines(s) {
  return s.split(/\r?\n/).filter(t => !t.includes(',,,,,'))
    .join(s.match(/\r?\n/)[0]);
}

async function runTest(filePath, csvPath, args, ignoreEmpty) {
  let testPdfData = new Uint8Array(fs.readFileSync(filePath));
  global.pdfDoc = await pdfjsLib.getDocument({ data: testPdfData, fontExtraProperties: true }).promise;
  global.done = false;
  classes.main(args);
  await waitForJDone();
  var expectTable = fs.readFileSync(csvPath, {encoding: 'utf8'} );
  var result = global.result;
  if (ignoreEmpty) {
    expectTable = ignoreEmptyLines(expectTable);
    result = ignoreEmptyLines(result);
  }
  expect(result).toBe(expectTable);
}

const TEST_MATCH = null; //'agstat';

describe('fullpdfs', () => {
  test('test all pdfs', async () => {
    const filterList = TEST_MATCH != null ? testsList.filter(test => test.name.includes(TEST_MATCH)) : testsList;
    const count = filterList.map(t => (t.stream ? 1 : 0) + (t.lattice ? 1 : 0))
                    .reduce((a,b)=> a+ b, 0);
      let c = TEST_MATCH != null ? testsList.filter(test => test.name.includes(TEST_MATCH)) : testsList;
    expect.assertions(1 + count);
    try {
      for (let test of filterList) {
        let fpath = path.resolve(__dirname, 'pdfs', test.file);
        if (test.stream) {
          let epath = path.resolve(__dirname, 'tables', test.stream);
          let targs = `${test.area}%${test.page}%n`;
          console.log(`Runnning: ${test.name} :: ${fpath} :: ${targs}`);
          await runTest(fpath, epath, targs, test.stream_ignore);
        }

        // lattice
        if (test.lattice) {
          let epath = path.resolve(__dirname, 'tables', test.lattice);
          let targs = `${test.area}%${test.page}%l`;
          console.log(`Runnning: ${test.name} :: ${fpath} :: ${targs}`);
          await runTest(fpath, epath, targs, test.lattice_ignore);
        }
      }
    } catch (e) {
      console.error(e);
    }
    expect(1).toBeTruthy();
  });
});
