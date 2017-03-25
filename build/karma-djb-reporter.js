/*global require, module */

'use strict';

const fs = require('fs');

const finalPerBrowser = {};

function makeBrowser() {
   return {
      test: {},
      total: {
         test: 0,
         success: 0,
         skipped: 0,
         time: 0
      },
      duplicate: []
   };
}

/*
API:

injectables:
   baseReporterDecorator
   config
   logger
   helper
   formatError

Functions:
      onRunStart()
         onBrowserStart(browser)
            renderBrowser(browser) ??
            onSpecComplete(browser, result)
            specSuccess(browser, result)
            specSkipped(browser, result)
            specFailure(browser, result)
         onBrowserComplete(browser, results)
      onRunComplete(browser, results)
   onExit
*/

function DJBJsonReporter(baseReporterDecorator, config) {
   baseReporterDecorator(this);   // This adds a bunch of basic functionality which we then override

   this.onSpecComplete = onSpecComplete;
   this.onRunComplete = onRunComplete;

   this._config = config;
}

function onRunComplete(browsers, results) {
   const directory = this._config.outputDir || '.';
   const fileName = this._config.outputFile || 'json-summary.json';
   const path = directory + '/all-' + fileName;

   if (!fs.statSync(directory)) {
      fs.mkdirSync(directory);
   }

   browsers.forEach((browser) => {
      fs.mkdirSync(directory + '/' + browser.name);
      fs.writeFileSync(directory + '/' + browser.name + '/' + fileName,
         JSON.stringify(finalPerBrowser[browser.name], null, 2));
   });

   if (results.disconnected) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭  GOT A DISCONNECTED IN THE REPORTER RESULTS');
      /* eslint-disable no-console */
      console.log(results);
      throw new Error();
   }

   if (results.error) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭  GOT AN ERROR IN THE REPORTER RESULTS');
      /* eslint-disable no-console */
      console.log(results);
      throw new Error();
   }
   fs.writeFileSync(path, JSON.stringify(results, null, 2));
}

function onSpecComplete(browser, result) {
//   console.log(JSON.stringify(result, undefined, 2));
   const browserName = browser.name;
   const fullTestName = result.suite.join(' • ') + ' • ' + result.description;

   if (!finalPerBrowser[browserName]) {
      finalPerBrowser[browserName] = makeBrowser();
   }

   const entry = finalPerBrowser[browserName];

   if (entry.test[fullTestName]) {
      entry.duplicate.push(fullTestName);
   }

   entry.test[fullTestName] = {
      result: result.success,
      time: result.time,
      skipped: result.skipped
   };

   entry.total.test ++;
   entry.total.success += result.success ? 1 : 0;
   entry.total.skipped += result.skipped ? 1 : 0;
   entry.total.time += result.time;
}

DJBJsonReporter.$inject = [ 'baseReporterDecorator', 'config.djbReporter' ];

module.exports = {
   'reporter:djb': [ 'type', DJBJsonReporter ]
};
