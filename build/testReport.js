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
      var resultsString = fs.readFileSync(browserFilePath, { encoding: 'utf8' });
      var resultsSummary = JSON.parse(resultsString);

      // Report if there are duplicate test names
      if (resultsSummary.duplicate.length > 0) {
         grunt.log.write('Duplicate test names with ' + browserName(browserFilePath) +
            ' on ' + osName(browserFilePath) + ':\n\t' + resultsSummary.duplicate.join('\n\t') + '\n');
         return true;
      }
   }

   function testReport() {
      var exists = fs.existsSync(this.data.dir);
      if (!exists) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + this.data.dir);
         return;
      }

      var browserFiles = grunt.file.expand(this.data.dir + '**/test-summary.json');
      var browserFailure = browserFiles.reduce(function handle(soFar, path) {
         return processResultsPerBrowser(path) || soFar;
      }, false);

      if (browserFailure) {
         grunt.fail.fatal('Test result failure.');
      }

      var testSummary = fs.readFileSync(this.data.dir + 'all-test-summary.json', { encoding: 'utf8' });

      var data = JSON.parse(testSummary);

      process.passthroughWrite(data.success + ' tests passed.\n');

      if (data.disconnected) {
         grunt.fail.fatal('Browsers disconnected. Build failed.');
      }

      if (data.error || data.failed) {
         grunt.fail.fatal(data.failed + ' test errors. Build failed.');
      }
   }

   grunt.registerMultiTask('testreport', 'Produces a summary of all test coverage', testReport);
};
