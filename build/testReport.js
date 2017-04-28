'use strict';

/* eslint-env node */
/* eslint-disable prefer-spread, no-console */

const fs = require('fs');
const path = require('path');

const tableFormatter = require('./text-table-formatter.js');
const util = require('./util.js');

const COLUMNS = [ {
   name: 'percentage',
   units: '%'
}, {
   name: 'browserName'
}, {
   name: 'browserVersion',
   alignChar: '.'
}, {
   name: 'osName'
}, {
   name: 'osVersion',
   alignChar: '.'
}, {
   name: 'seconds',
   alignChar: '.'
}, {
   name: 'counts',
   alignChar: '/'
}, {
   name: 'skipped'
} ];

function processResultsPerBrowser(browserFilePath) {
   const summaryJson = fs.readFileSync(browserFilePath, { encoding: 'utf8' });
   const summary = JSON.parse(summaryJson);

   const browserAndOsName = path.basename(path.dirname(browserFilePath));
   const results = util.extractBrowserAndOsNames(browserAndOsName);

   results.failure = false;
   results.run = 0;
   results.passed = 0;
   results.skipped = 0;
   results.time = 0;

   for (const key in summary.tests) {
      results.run++;
      results.time += summary.tests[key].milliseconds;

      if (summary.tests[key].passed) {
         results.passed++;
      }
      if (summary.tests[key].skipped) {
         results.skipped ++;
      }
   }

   if (summary.duplicateNames.length > 0) {
      results.duplicates = summary.duplicateNames.join('\n\t');
      results.failure = true;
   }

   if (results.run !== results.passed) {
      results.failure = true;
   }

   results.percentage = (((results.passed - results.skipped) / results.run) * 100);
   results.seconds = (results.time / 1000) + 'ms';
   results.counts = (results.passed - results.skipped) + '/' + results.run;
   if (results.skipped) {
      results.skipped = 'Skipped ' + results.skipped;
   }

   return results;
}

// Not entirely clear what the disconnected and error/failure fields mean and when used.
// Report them with some pretty distinctive messages if they appear.
function reportOnSummaryInfo(grunt, dataDir) {
   const summaryJson = fs.readFileSync(dataDir + 'all-test-summary.json', { encoding: 'utf8' });
   const summaryStats = JSON.parse(summaryJson);

   if (summaryStats.disconnected) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭 GOT A DISCONNECTED IN THE REPORTER RESULTS');
      grunt.fail.fatal('Browsers disconnected. Build failed.');
   }

   if (summaryStats.error || summaryStats.failed) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭 GOT AN ERROR IN THE REPORTER RESULTS');
      grunt.fail.fatal(summaryStats.failed + ' test errors. Build failed.');
   }
}

function reportDuplicateTestNames(grunt, browserResults) {
   let shownHeader = false;
   browserResults.map((result) => {
      if (!result.duplicates) {
         return;
      }

      if (!shownHeader) {
         grunt.log.error('DUPLICATE TEST NAMES\n');
         shownHeader = true;
      }
      grunt.log.error('Browser: ' + result.browserName + '\n');
      grunt.log.error(result.duplicates + '\n');
   });
}

module.exports = (grunt) => {

   function testReport() {
      if (!fs.existsSync(this.data.dir)) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + this.data.dir);
         return;
      }

      const resultFiles = grunt.file.expand(this.data.dir + '**/test-summary.json');
      const browserResults = resultFiles.map(processResultsPerBrowser);

      reportDuplicateTestNames(grunt, browserResults);

      const table = tableFormatter(browserResults, { columns: COLUMNS });
      grunt.log.write(table);

      if (this.data.summaryFile) {
         fs.writeFileSync(this.data.summaryFile, table, 'UTF-8');
      }

      reportOnSummaryInfo(grunt, this.data.dir);

      const failure = browserResults.reduce((soFar, result) => { return result.failure || soFar; }, false);
      if (failure) {
         grunt.fail.fatal('Tests failed.');
      }
   }

   grunt.registerMultiTask('testreport', 'Produces a summary of all test coverage', testReport);
};
