## Getting Started
```
npm install
npm run start:dev
```
* Navigate to `http://127.0.0.1:8080`
* Import a PDF and select+extract a table.
* The results will be dumped to the console.

## Prod Build
* Edit `webpack.config.prod.js` and add in the resulting url where the code will be deployed.
* Edit `src/index.js` and modify `handleResult()` to do something with the generated csv.

