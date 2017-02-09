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
         grunt.fail.fatal('Tests failed.');
      }

      const maxLengths = {};
      const sortedNames = [];
      const byBrowserName = {};

      browserResults.map((result) => {
         for (const name in result) {
            maxLengths[name] = maxLengths[name] || 0;
            maxLengths[name] = Math.max(result[name].length, maxLengths[name]);
         }
         var browserMatch = /([A-Za-z]+) ([0-9\.]+)/.exec(result.name);
         var osMatch = /^([^0-9]+) ([0-9\.]+)/.exec(result.os);
         result.browserName = browserMatch[1];
         result.browserVersion = browserMatch[2];
         result.osName = osMatch[1];
         result.osVersion = osMatch[2];

         sortedNames.push(result.name);
         byBrowserName[result.name] = result;
      });

      function padValue(value, columnWidth) {
         let nameResult = value;
         for (let paddingSpace = value.length - 1; paddingSpace < columnWidth; paddingSpace++) {
            nameResult += ' ';
         }

         return nameResult;
      }

      sortedNames.sort();

      for (let index = 0; index < sortedNames.length; index++) {
         const name = sortedNames[index];
         const value = [];
         value.push(padValue((byBrowserName[name].passed / byBrowserName[name].run) * 100, maxLengths.time) + '%');
         value.push(padValue(byBrowserName[name].browserName, maxLengths.browserName));
         value.push(padValue(byBrowserName[name].browserVersion, maxLengths.browserVersion));
         value.push(padValue(byBrowserName[name].osName, maxLengths.osName));
         value.push(padValue(byBrowserName[name].osVersion, maxLengths.osVersion));
         value.push(padValue(byBrowserName[name].time / 1000, maxLengths.time) + 'ms');
         value.push(padValue(`${byBrowserName[name].passed}/${byBrowserName[name].run}`, maxLengths.time));
         if (byBrowserName[name].skipped) {
            value.push(`Skipped ${byBrowserName[name].skipped}`);
         }
         process.passthroughWrite(value.join(' │ ') + '\n');
      }

//      for (const key in byOs) {
//         process.passthroughWrite(key + '\n');
//         for (let index = 0; index < byOs[key].length; index++) {
//            const browserInfo = byOs[key][index];
//            process.passthroughWrite(`\t${formatName(browserInfo.name)}: ` +
//               `${(browserInfo.passed / browserInfo.run) * 100}% : ` +
//               `${browserInfo.passed}/${browserInfo.run} in ${browserInfo.time}ms ` +
//               `(Skipped ${browserInfo.skipped})\n`);
//         }
//      }

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
