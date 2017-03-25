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

      let shownHeader = false;
      browserResults.map((result) => {
         if (result.duplicates) {
            if (!shownHeader) {
               grunt.log.error('DUPLICATE TEST NAMES\n');
               shownHeader = true;
            }
            grunt.log.error('Browser: ' + result.name + '\n');
            grunt.log.error(result.duplicates + '\n');
         }
      });
      if (failure) {
         grunt.fail.fatal('Tests failed.');
      }

      const maxLengths = {};
      const sortedNames = [];
      const byBrowserName = {};
      let skipped = false;

      browserResults.map((result) => {
         var browserMatch = /([A-Za-z]+) ([0-9\.]+)/.exec(result.name);
         var osMatch = /^([^0-9]+) ([0-9\.]+)/.exec(result.os);
         result.browserName = browserMatch[1];
         result.browserVersion = browserMatch[2];
         result.osName = osMatch[1];
         result.osVersion = osMatch[2];
         result.percent = (((result.passed - result.skipped) / result.run) * 100) + '%';
         result.seconds = (result.time / 1000) + 'ms';
         result.counts = (result.passed - result.skipped) + '/' + result.run;

         if (result.skipped) {
            skipped = true;
            result.skipped = 'Skipped ' + result.skipped;
         }
         [ 'osName', 'osVersion', 'browserName', 'browserVersion', 'time', 'percent', 'seconds', 'counts', 'skipped' ]
            .forEach((name) => {
               maxLengths[name] = maxLengths[name] || 0;
               maxLengths[name] = Math.max(result[name].toString().length, maxLengths[name]);
            });

         sortedNames.push(result.name);
         byBrowserName[result.name] = result;
      });

      function padValue(value, columnWidth, padChar) {
         let nameResult = value;
         for (let paddingSpace = value.length; paddingSpace < columnWidth; paddingSpace++) {
            nameResult += padChar || ' ';
         }

         return nameResult;
      }

      // would be nice to identify decimal places, and padd out numbers so they line up on that, and for the versions,
      // align on the first
      function padLeftValue(value, columnWidth, padChar) {
         let nameResult = '';
         for (let paddingSpace = value.length; paddingSpace < columnWidth; paddingSpace++) {
            nameResult += padChar || ' ';
         }

         return nameResult + value;
      }

      sortedNames.sort();

      process.passthroughWrite('TESTS\n');

      const border = [];
      border.push(padValue('', maxLengths.percent, '─'));
      border.push(padValue('', maxLengths.browserName, '─'));
      border.push(padValue('', maxLengths.browserVersion, '─'));
      border.push(padValue('', maxLengths.osName, '─'));
      border.push(padValue('', maxLengths.osVersion, '─'));
      border.push(padValue('', maxLengths.seconds, '─'));
      border.push(padValue('', maxLengths.counts, '─'));
      if (skipped) {
         border.push(padValue('', maxLengths.skipped, '─'));
      }
      process.passthroughWrite('┌─' + border.join('─┬─') + '─┐\n');

      for (let index = 0; index < sortedNames.length; index++) {
         const name = sortedNames[index];
         const value = [];
         value.push(padLeftValue(byBrowserName[name].percent, maxLengths.percent));
         value.push(padValue(byBrowserName[name].browserName, maxLengths.browserName));
         value.push(padValue(byBrowserName[name].browserVersion, maxLengths.browserVersion));
         value.push(padValue(byBrowserName[name].osName, maxLengths.osName));
         value.push(padValue(byBrowserName[name].osVersion, maxLengths.osVersion));
         value.push(padLeftValue(byBrowserName[name].seconds, maxLengths.seconds));
         value.push(padLeftValue(byBrowserName[name].counts, maxLengths.counts));
         if (skipped) {
            value.push(padValue(byBrowserName[name].skipped, maxLengths.skipped));
         }
         process.passthroughWrite('│ ' + value.join(' │ ') + ' │\n');
      }
      process.passthroughWrite('└─' + border.join('─┴─') + '─┘\n');
      process.passthroughWrite('Missing node.js results\n');

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
