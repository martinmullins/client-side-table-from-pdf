import { PDDocument } from '../pdfbox_emu/PDDocument';
import { runPDFTextStripper } from '../pdfbox_emu/PDFTextStripper';
import { runPDFGraphicsStreamEngine } from '../pdfbox_emu/PDFGraphicsStreamEngine';
import * as classes from '../generated/classes';
import '../viewer.css'
import '../index.scss';

import * as tata from 'tata-js';

const lsGet = (name) => {
  try {
    return localStorage.getItem(name);
  } catch (e) { }

  return null;
};

const lsSet = (name, value) => {
  try {
    localStorage.setItem(name, value);
  } catch (e) { }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MAX_WAIT = 60000;
const MAX_STEP = 100;
const MAX_ITER = MAX_WAIT/MAX_STEP;
async function waitForJDone() {
  for (let i = 0; i < MAX_ITER; ++i) {
    if (window.done) {
      break;
    }
    await sleep(MAX_STEP);
  }
}
  
function init(handleCSVResult) {
  var rect = {},
      drag = false;

  var selected = { };
  var pdfRendered = false;

  // do custom fit button
  const fitIcon = '<svg fill="rgb(54,54,54)" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" role="none" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></g></svg>';
  const widthIcon = '<svg fill="rgb(54,54,54)" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" role="none" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></g></svg>';
  var zoomFitBtn = document.getElementById('zoomFit');
  if (zoomFitBtn) {
    let toFit = true;
    zoomFitBtn.querySelector('span.icon').innerHTML = fitIcon;
    zoomFitBtn.addEventListener('click', (e) => {
      if (toFit) {
        toFit = false;
        window.PDFViewerApplication.pdfViewer.currentScaleValue = "page-fit";
        zoomFitBtn.querySelector('span.icon').innerHTML = widthIcon;
        zoomFitBtn.title = 'Zoom to width';
      } else {
        toFit = true;
        window.PDFViewerApplication.pdfViewer.currentScaleValue = "page-width";
        zoomFitBtn.querySelector('span.icon').innerHTML = fitIcon;
        zoomFitBtn.title = 'Zoom to fit';
      }
    });
  }

  var openModal = document.querySelector('.open-modal');
  var modal = document.querySelector('.settings-modal');
  var closeModal = document.querySelector('.settings-modal-close');
  openModal.addEventListener('click', (e) => {
    modal.classList.add('is-active');
  });
  closeModal.addEventListener('click', (e) => {
    modal.classList.remove('is-active');
  });


  var spacesInp = document.querySelector('button.by-spaces');
  var linesInp = document.querySelector('button.by-lines');
  //window.method = linesInp.checked ? 'l' : 'n';
  const setSpaces = () => {
    window.method = 'n'; 
    spacesInp.classList.add('toggled');
    linesInp.classList.remove('toggled');
    lsSet('method-mode', 'n');
  };

  const setLines = () => {
    window.method = 'l'; 
    linesInp.classList.add('toggled');
    spacesInp.classList.remove('toggled');
    lsSet('method-mode', 'l');
  }

  spacesInp.addEventListener('click', setSpaces);
  linesInp.addEventListener('click', setLines);

  let lastMethod = lsGet('method-mode');
  if (lastMethod) {
    switch(lastMethod) {
      case 'l':
        window.method = 'l';
        setLines();
        break;
      default:
        setSpaces();
        window.method = 'n';
        break;
    }
  }
  
  if (!lastMethod || !window.method) {
    setSpaces();
    window.method = 'n';
  }

  let lastLang = lsGet('last-lang');
  if (lastLang) {
      const langs = [ "afr", "ara", "aze", "bel", "ben", "bul", "cat", "ces", "chi_sim",
        "chi_tra", "chr", "dan", "deu", "ell", "eng", "enm", "meme", "epo",
        "epo_alt", "equ", "est", "eus", "fin", "fra", "frk", "frm", "glg",
        "grc", "heb", "hin", "hrv", "hun", "ind", "isl", "ita", "ita_old",
        "jpn", "kan", "kor", "lav", "lit", "mal", "mkd", "mlt", "msa",
        "nld", "nor", "pol", "por", "ron", "rus", "slk", "slv", "spa",
        "spa_old", "sqi", "srp", "swa", "swe", "tam", "tel", "tgl", "tha", "tur",
        "ukr", "vie" ];
      if (langs.includes(lastLang)) {
        window.imageLang = lastLang;
      }
  } 
  
  if (!lastLang  || !window.imageLang) {
    lastLang = 'eng';
    window.imageLang = 'eng';
  }

  const langSelect = document.querySelector('div.lang-select select');
  const options = document.querySelectorAll('div.lang-select select option');
  for (let opt of options) {
    if (opt.value === lastLang) {
      opt.selected = true;
    } else {
      opt.selected = undefined;
    }
  }

  langSelect.addEventListener('change', () => {
    var opt = langSelect.options[langSelect.selectedIndex];
    lsSet('last-lang', opt.value);
    window.imageLang = opt.value;
  });

  const useImage = document.getElementById('useImage');
  window.docMode = 'DOC';
  let lastDoc = lsGet('doc-mode');
  if (!lastDoc) {
    lastDoc = window.docMode;
  }

  switch(lastDoc) {
    case 'IMG':
      useImage.checked = true;
      window.docMode = 'IMG';
      langSelect.disabled = undefined;
      break;
    case 'DOC':
      useImage.checked = false;
      window.docMode = 'DOC';
      langSelect.disabled = true;
      break;
  }

  useImage.addEventListener('change', () => {
    if (useImage.checked) {
      window.docMode = 'IMG';
      langSelect.disabled = undefined;
    } else {
      window.docMode = 'DOC';
      langSelect.disabled = true;
    }
    lsSet('doc-mode', window.docMode);
  });


  //setupAllDropdowns();
  //setupDropdown('method-dropdown', lastMethod, (val) => {
  //  return `<span>Method: <strong>${val}</strong></span>`;
  //}, setMethodMode);

  //setupDropdown('lang-dropdown', lastLang, (val) => {
  //  return `<span>Lang: <strong>${val}</strong></span>`;
  //}, (val) => {
  //  lsSet('last-lang', val);
  //  window.imageLang = val;
  //});

  //setupDropdown('additional-menu-dropdown', null, null, () => {});
  var selectBtn = document.getElementById('selectTable');
  var extractBtn = document.getElementById('extractTable');
  var clearBtn = document.getElementById('clearTable');
  var selectTableHelper = document.getElementById('selectTableHelper');
  selectTableHelper.querySelector('button.delete').addEventListener('click', (e) => {
    selectTableHelper.style.display = 'none';
  });

  var topRightInd = document.getElementById('topRight');
  var topLeftInd = document.getElementById('topLeft');
  var bottomEdgeInd = document.getElementById('bottomEdge');
  var selectingTable = false;
  var pos = [];
  var boxCanvas = null;
  var page = null;
  var boxCtx = null;
  var container = document.querySelector('#mainContainer');
  var pageDim = null;
  var pageNum = 0;

  function extractTheTable() {
    extractBtn.classList.add('is-loading');
    var top = Math.floor(pos[0].y * 100);
    var left = Math.floor(pos[0].x * 100);
    var bottom = Math.ceil(pos[2].y * 100);
    var right = Math.ceil(pos[1].x * 100);
    var area = `%${top},${left},${bottom},${right}`;
    console.log('AREA2:', area, 'PAGE:', pageNum);
    //runTableEngine(area, pageNum);
    try {
      classes.main(`${area}%${pageNum}%${window.method}`); //'%8,7,16,42');
    } catch (e) {
      tata.error('Failure', 'Please refresh the page', { position: 'bm', holding: true });
      console.error(e);
    }
    window.result = '';
    window.done = false;
    waitForJDone().then(() => {
      if (window.result) {
        tata.clear();
        tata.success('Success', 'Found table data in selection', { position: 'bm' });
        handleCSVResult(window.result);
      } else {
        tata.clear();
        tata.warn('Warning', 'No table was found for selection', { position: 'bm' });
      }
      console.log('DONE');
      extractBtn.classList.remove('is-loading');
    }).catch((e) => {
      tata.clear();
      tata.error('Failure', 'Please refresh the page', { position: 'bm', holding: true });
      console.error(e);
      extractBtn.classList.remove('is-loading');
    });
  }

  window.resetSelection = () => {
      selectingTable = false;
      pos = [];
      selectTableHelper.style.display = 'none';
      document.querySelector('.pdf-content').style.cursor = '';
      if (extractBtn) {
        extractBtn.setAttribute("disabled", "true");
      }
      if (clearBtn) {
        clearBtn.setAttribute("disabled", "true");
      }

      if (page && page.contains(boxCanvas)) {
        page.removeChild(boxCanvas);
      }
      //if (boxCanvas && boxCanvas.parent) {
      //  boxCanvas.parent.removeChild(boxCanvas);
      //} else {
      //  boxCanvas =null;
      //}
  };

  window.stopSelectingTable = () => {
    if (selectingTable) {
      window.resetSelection();
    }
  };

  if (clearBtn) {
    clearBtn.setAttribute("disabled","true");
    clearBtn.addEventListener('click', window.resetSelection);
  }

  if (selectBtn) {
    selectBtn.setAttribute("disabled","true");
    selectBtn.addEventListener('click', () => {
      window.resetSelection();
      console.log('SelectButton Clickeded');
      topLeftInd.className = 'step-item is-active';
      topRightInd.className = 'step-item';
      bottomEdgeInd.className = 'step-item';
      selectingTable = true;
      //selectBtn.className = 'button select-table-button is-small';
      document.querySelector('.pdf-content').style.cursor = 'crosshair';
      const eoc = document.querySelector('.endOfContent');
      if (eoc) {
        eoc.className = 'endOfContent';
      }
      document.querySelector('#viewerContainer').focus();
    });
  }

  if (extractBtn) {
    extractBtn.setAttribute("disabled","true");
    extractBtn.addEventListener('click', () => {
      console.log('ExtractButton Clickeded');
      window.pos = pos;
      if (pos.length === 3) {
        extractTheTable();
      }
    });
  }

  
  function draw() {
    boxCtx.strokeStyle = "#FF0000";
    boxCtx.fillStyle= "rgba(0,0,200,0.5)";
    boxCtx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
    selected.top = Math.floor(100 * rect.startY / boxCtx.canvas.height);
    selected.left = Math.floor(100 * rect.startX / boxCtx.canvas.width);
    selected.bottom = Math.ceil(100 * (rect.startY + rect.h) / boxCtx.canvas.height);
    selected.right = Math.ceil(100 * (rect.startX + rect.w) / boxCtx.canvas.width);
  }

  function drawPos() {
    boxCtx.clearRect(0, 0, boxCanvas.width, boxCanvas.height);
    boxCtx.fillStyle= "rgba(77,208,225,0.5)";
    let posV = pos.map(({x,y}) => {
      return {x: x*boxCanvas.width, y: y*boxCanvas.height };
    });

    if (posV.length > 2) {
      let startX = posV[0].x; 
      let startY = posV[0].y; 
      let width = posV[1].x - posV[0].x;
      let height = posV[2].y - posV[0].y;

      boxCtx.fillRect(startX, startY, width, height);
      boxCtx.strokeStyle = 'gray';
      boxCtx.setLineDash([5,5]);
      boxCtx.strokeRect(startX, startY, width, height);
    }

    if (posV[0]) {
      boxCtx.beginPath();
      boxCtx.strokeStyle = (posV.length === 1) ? "#0000FF" : 'black';
      boxCtx.moveTo(posV[0].x, posV[0].y);
      boxCtx.lineTo(posV[0].x+10, posV[0].y);
      boxCtx.moveTo(posV[0].x, posV[0].y);
      boxCtx.lineTo(posV[0].x, posV[0].y + 10);
      boxCtx.stroke();
    }

    if (posV[1]) {
      boxCtx.beginPath();
      boxCtx.strokeStyle = "#FF0000";
      boxCtx.strokeStyle = (posV.length === 2) ? "#0000FF" : 'black';
      boxCtx.moveTo(posV[1].x, posV[1].y);
      boxCtx.lineTo(posV[1].x-10, posV[1].y);
      boxCtx.moveTo(posV[1].x, posV[1].y);
      boxCtx.lineTo(posV[1].x, posV[1].y + 10);
      boxCtx.stroke();

      if (posV.length === 2) {
        boxCtx.beginPath();
        boxCtx.strokeStyle = 'gray';
        boxCtx.setLineDash([5,5]);
        boxCtx.moveTo(posV[0].x + 10, posV[0].y);
        boxCtx.lineTo(posV[1].x - 10, posV[0].y);
        boxCtx.stroke();
      }
    }

    if (posV[2]) {
      boxCtx.beginPath();
      boxCtx.strokeStyle = "#FF0000";
      boxCtx.strokeStyle = (posV.length === 2) ? "#0000FF" : 'black';
      let halfX = (posV[1].x - posV[0].x)/2 + posV[0].x;
      boxCtx.moveTo(halfX, posV[2].y);
      boxCtx.lineTo(halfX-10, posV[2].y);
      boxCtx.moveTo(halfX, posV[2].y);
      boxCtx.lineTo(halfX+10, posV[2].y);
      boxCtx.stroke();

    }

  }

  var pageMut = new MutationObserver(() => {
    console.log('MUTATION');
    if (!boxCanvas || !selectingTable) {
      return;
    }
    pageDim = page.getBoundingClientRect();
    boxCanvas.width = pageDim.width;
    boxCanvas.style.width = pageDim.width;
    boxCanvas.height = pageDim.height;
    boxCanvas.style.height = pageDim.height;
    if (!page.contains(boxCanvas)) {
      page.appendChild(boxCanvas);
    }
    drawPos();
  });

  function posToPercent({x,y}) {
    let px = x / boxCtx.canvas.width;
    let py = y / boxCtx.canvas.height;
    return {x: px, y: py};
  }

  if (container) {
    var firstClick = null;
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selectingTable) {
        window.resetSelection();
      }
    });

    container.addEventListener('mousedown', (e) => {
      console.log('MOUSE DOWN');
      if (e.target && e.target.className == 'textLayer' && selectingTable && pos.length === 0) {
        console.log('OK');
        firstClick = true;
        boxCanvas = document.createElement('canvas');
        page = e.target.offsetParent;
        pageDim = e.target.getBoundingClientRect();
        pageMut.disconnect();
        pageMut.observe(page, { subtree: true, attributes: true, attributeFilter: ["style"] });

        boxCanvas.style.width = pageDim.width;
        boxCanvas.style.height = pageDim.height;
        boxCanvas.style.position = 'absolute';
        //boxCanvas.style.background = 'wheat';
        boxCanvas.style.left = 0;
        boxCanvas.style.top = 0;
        boxCanvas.style.zIndex = 1;
        boxCtx = boxCanvas.getContext('2d');
        boxCtx.canvas.width = pageDim.width;
        boxCtx.canvas.height = pageDim.height;
        page.appendChild(boxCanvas);
        console.log(e.clientX);
        console.log(pageDim.left);
        console.log('PAGE IS: ',page.dataset.pageNumber);
        pageNum = page.dataset.pageNumber;
        rect.startX = e.clientX - pageDim.left;
        rect.startY = e.clientY - pageDim.top;
        firstClick = posToPercent({x: rect.startX, y: rect.startY });
        pos = [firstClick];
        drawPos();
        topLeftInd.className = 'step-item is-completed';
        topRightInd.className = 'step-item is-active';
        bottomEdgeInd.className = 'step-item';
        drag = true;
        e.stopPropagation();
        e.preventDefault();


        boxCanvas.addEventListener('mousedown', (e) => {
          if (page && boxCanvas) {
            if (selectingTable && pos.length < 3) {
              pageDim = e.target.getBoundingClientRect();
              pos.push(posToPercent({ x: e.clientX - pageDim.left, y: e.clientY - pageDim.top }));
              if (pos.length == 2) {
                if (pos[0].x > pos[1].x) {
                  let tmpPos = pos[0];
                  pos[0] = pos[1];
                  pos[1] = tmpPos;
                }
                topLeftInd.className = 'step-item is-completed';
                topRightInd.className = 'step-item is-completed';
                bottomEdgeInd.className = 'step-item is-active';
              } else if (pos.length == 3) {
                let maxY = Math.max(pos[0].y, pos[1].y, pos[2].y);
                let minY = Math.min(pos[0].y, pos[1].y, pos[2].y);
                pos[0].y = minY;
                pos[1].y = minY;
                pos[2].y = maxY;

                topLeftInd.className = 'step-item is-completed';
                topRightInd.className = 'step-item is-completed';
                bottomEdgeInd.className = 'step-item is-completed';
              }

              if (pos.length === 2) {
                if (pos[0].y < pos[1].y) {
                  pos[1].y = pos[0].y;
                } else {
                  pos[0].y = pos[1].y;
                }
              }
              console.log('POS:', pos);
              drawPos();
              e.stopPropagation();
            }
          }
        });
      }
    });

    container.addEventListener('mouseup', (e) => {
      firstClick = null;
      console.log('MOUSE UP');
      if (page && boxCanvas && pos.length === 3 && selectingTable) {
        console.log('MOUSE UP INNER');
        // enable extract button
        selectingTable = false;
        document.querySelector('.pdf-content').style.cursor = '';
        extractBtn.removeAttribute("disabled");
        clearBtn.removeAttribute("disabled");
        selectTableHelper.style.display = 'none';
        e.stopPropagation();
        e.preventDefault();
      } else if (pos.length == 1 && selectingTable) {
        selectTableHelper.style.display = '';
      }
    }, true);

    container.addEventListener('mousemove', (e) => {
      //console.log('MOUSE MOVE');
      if (page && boxCanvas && pos.length >= 1 && firstClick && selectingTable) {
        //console.log('MOUSE MOVE INNER');
        var posNew = [];
        var posOther = posToPercent({x: e.clientX - pageDim.left, y: e.clientY - pageDim.top});
        const minx = Math.min(firstClick.x, posOther.x);
        const maxx = Math.max(firstClick.x, posOther.x);
        const miny = Math.min(firstClick.y, posOther.y);
        const maxy = Math.max(firstClick.y, posOther.y);
        posNew.push({ x: minx, y: miny });
        posNew.push({ x: maxx, y: miny });
        posNew.push({ x: maxx - ((maxx - minx)/2), y: maxy });
        pos = posNew;
        drawPos();
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
} else {
    console.error('cant find pdf container');
  }
  
    //canvas.addEventListener('mousedown', mouseDown, false);
    //canvas.addEventListener('mouseup', mouseUp, false);
    //canvas.addEventListener('mousemove', mouseMove, false);
}

function mouseUp() {
  drag = false;
  if (pdfRendered && selected) {
    var area = `%${selected.top},${selected.left},${selected.bottom},${selected.right}`;
    console.log('AREA:',area);
    //runTableEngine(area);
  }
}

 
var loadEvent = false;
const stopPace = () => {
  if (loadEvent) {
    if (window.Pace) {
      window.Pace.stop();
    }
    document.body.classList.add('pace-all-done');
  }
  loadEvent = true;
};

export const configureProc = (handleCSVResult) => {
  
  window.pdfjsLib = pdfjsLib;
  window.PDDocument = PDDocument;
  window.runPDFTextStripper = runPDFTextStripper;
  window.runPDFGraphicsStreamEngine = runPDFGraphicsStreamEngine;
  window.docMode = 'DOC';
  window.method = 'l';
  console.log('>> ',pdfjsLib);

  window.addEventListener('load', (e) => {
    stopPace();
  });

  window.addEventListener('documentloaded', (e) => {
    console.log('DOCUMENT LOADED', window.pdfDoc);
    var selectBtn = document.getElementById('selectTable');
    selectBtn.removeAttribute("disabled");
    // pdf.js inserts this one:
    var fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      document.title = `PDF.T.U - ${fileInput.files[0].name}`;
    }

    document.body.classList.add('pace-all-done');
  });

  window.addEventListener('pagerendered', (e) => {
    console.log('page rendered', e.details);
  });

  init(handleCSVResult);
  stopPace();
}