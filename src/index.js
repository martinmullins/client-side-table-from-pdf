import 'regenerator-runtime/runtime';
import * as Papa from "papaparse";
import 'core-js';

import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faFolderOpen,
  faExpandAlt,
  faSearch,
  faAngleDown,
  faObjectGroup, 
  faCogs,
  faChevronUp,
  faChevronDown,
  faSearchPlus,
  faSearchMinus ,
  faUndo,
  faEllipsisV,
  faVectorSquare
} from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

library.add(
  // top bar
  faFolderOpen,
  faSearch,
  faCogs,
  faAngleDown,
  faChevronUp,
  faChevronDown,
  faTrashAlt,
  faExpandAlt,
  faEllipsisV,
  faVectorSquare,
  // bot bar
  faSearchPlus,
  faSearchMinus,
  faUndo
);

dom.i2svg();

import { configureProc } from './engine/proc';

const handleResult = (csv) => {

  console.log("CSV RESULT", csv)
  const aoa = Papa.parse(csv)?.data
  console.log("ARRAY RESULT", aoa) 
  console.table(aoa)

  // if (window.parent.postMessage) {
  //   window.parent.postMessage(csv, '*');
  // } 
}

configureProc(handleResult);

// setup display for pdf-content view only
const init = () => {
  if (!window.history.replaceState) {
    window.history.replaceState = () => {};
  }

  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function (callback, type, quality) {
        var canvas = this;
        setTimeout(function () {
          var binStr = atob(canvas.toDataURL(type, quality).split(",")[1]),
            len = binStr.length,
            arr = new Uint8Array(len);

          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
          }

          callback(new Blob([arr], { type: type || "image/png" }));
        });
      },
    });
  }

  const content = document.querySelector(".pdf-content");
  content.style.display = "";
};

init();
