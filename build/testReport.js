'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');

var BROWSERID_SEPARATION_NAME = /^.*\/([^\/]+)\/[^\/]+$/;
var BROWSER_VERSION_OS_VERSION_SEPARATION_REGEX = /^(.*) \((.*)\)$/;

module.exports = (grunt) => {

   function browserName(path) {
      var browserId = BROWSERID_SEPARATION_NAME.exec(path);
      var browserAndOs = BROWSER_VERSION_OS_VERSION_SEPARATION_REGEX.exec(browserId[1]);

      return browserAndOs[1];
   }

   function osName(path) {
      var browserId = BROWSERID_SEPARATION_NAME.exec(path);
      var browserAndOs = BROWSER_VERSION_OS_VERSION_SEPARATION_REGEX.exec(browserId[1]);

      return browserAndOs[2];
   }

   function processResultsPerBrowser(browserFilePath) {
      const summaryJson = fs.readFileSync(browserFilePath, { encoding: 'utf8' });
      const summary = JSON.parse(summaryJson);
      const results = {
         failure: false,
         os: osName(browserFilePath),
         run: 0,
         passed: 0,
         skipped: 0,
         time: 0,
         name: browserName(browserFilePath)
      };

      for (const key in summary.test) {
         results.run++;
         results.time += summary.test[key].time;

         if (summary.test[key].result) {
            results.passed++;
         }
         if (summary.test[key].skipped) {
            results.skipped ++;
         }
      }

      if (summary.duplicate.length > 0) {
         results.duplicates = summary.duplicate.join('\n\t');
         results.failure = true;
      }

      if (results.run !== results.passed) {
         results.failure = true;
      }

      return results;
   }

   function testReport() {
      var exists = fs.existsSync(this.data.dir);
      if (!exists) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + this.data.dir);
         return;
      }

      var browserFiles = grunt.file.expand(this.data.dir + '**/test-summary.json');
      var browserResults = browserFiles.map(processResultsPerBrowser);
      const failure = browserResults.reduce((soFar, result) => { return result.failure || soFar; }, false);

      if (failure) {
         grunt.fail.fatal('Test result failure.');
      }

      const byOs = {};
      browserResults.map((result) => {
         byOs[result.os] = byOs[result.os] || [];
         byOs[result.os].push(result);
      });

      let maxLength = 0;
      for (const key in byOs) {
         for (let index = 0; index < byOs[key].length; index++) {
            const browserInfo = byOs[key][index];
            maxLength = Math.max(browserInfo.name.length, maxLength);
         }
      }

      function formatName(name) {
         let nameResult = name;
         for (let paddingSpace = name.length - 1; paddingSpace < maxLength; paddingSpace++) {
            nameResult += ' ';
         }

         return nameResult;
      }

      for (const key in byOs) {
         process.passthroughWrite(key + '\n');
         for (let index = 0; index < byOs[key].length; index++) {
            const browserInfo = byOs[key][index];
            process.passthroughWrite(`\t${formatName(browserInfo.name)}: ` +
               `${(browserInfo.passed / browserInfo.run) * 100}% : ` +
               `${browserInfo.passed}/${browserInfo.run} in ${browserInfo.time}ms ` +
               `(Skipped ${browserInfo.skipped})\n`);
         }
      }

      // where did disconnected etc come from?
      //      var testSummary = fs.readFileSync(this.data.dir +
      //       'all-test-summary.json', { encoding: 'utf8' });
      //
      //      var data = JSON.parse(testSummary);
      //
      //      process.passthroughWrite(data.success + ' tests passed.\n');
      //
      //      if (data.disconnected) {
      //         grunt.fail.fatal('Browsers disconnected. Build failed.');
      //      }
      //
      //      if (data.error || data.failed) {
      //         grunt.fail.fatal(data.failed + ' test errors. Build failed.');
      //      }
   }

   grunt.registerMultiTask('testreport', 'Produces a summary of all test coverage', testReport);
};
