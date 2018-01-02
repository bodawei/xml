/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env node */

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const tableFormatter = require('text-table-formatter');

const util = require('./util.js');

const DEFAULT_SUMMARY_FILE = 'testReport.txt';
const DEFAULT_REPORTS_DIR = './';
const DEFAULT_REPORT_NAME = 'test-summary.json';

const COLUMNS = [ {
   propName: 'percentage',
   unit: '%',
}, {
   propName: 'browserName',
}, {
   propName: 'browserVersion',
   alignChar: '.',
}, {
   propName: 'osName',
}, {
   propName: 'osVersion',
   alignChar: '.',
}, {
   propName: 'seconds',
   alignChar: '.',
}, {
   propName: 'counts',
   alignChar: '/',
}, {
   propName: 'skipped',
} ];

/*
 * For each set of test results, read in the relevant file, and build a
 * hash with the results of that test run
 */
function processResultsPerBrowser(browserFilePath) {
   const summaryJson = fs.readFileSync(browserFilePath, { encoding: 'utf8' });
   const summary = JSON.parse(summaryJson);
   let testsRun = 0;
   let testsPassed = 0;
   let testsSkipped = 0;
   let totalTime = 0;
   let failure = false;
   let duplicates;

   const browserAndOsName = path.basename(path.dirname(browserFilePath));

   for (const key in summary.tests) {
      testsRun++;
      totalTime += summary.tests[key].milliseconds;
      testsPassed += summary.tests[key].passed ? 1 : 0;
      testsSkipped += summary.tests[key].skipped ? 1 : 0;
   }

   if (testsRun !== testsPassed) {
      failure = true;
   }

   if (summary.duplicateNames.length > 0) {
      duplicates = summary.duplicateNames.join('\n\t');
      failure = true;
   }

   const results = util.extractBrowserAndOsNames(browserAndOsName);
   results.percentage = (((testsPassed - testsSkipped) / testsRun) * 100);
   results.seconds = (totalTime / 1000) + 'ms';
   results.counts = (testsPassed - testsSkipped) + '/' + testsRun;
   results.skipped = testsSkipped ? 'Skipped ' + testsSkipped : '';
   results.duplicates = duplicates;
   results.failure = failure;

   return results;
}

/*
 * Not entirely clear what the disconnected and error/failure fields mean
 * and when used. Report them with some pretty distinctive messages if
 * they appear.
 */
function reportOnSummaryInfo(dataDir) {
   const summaryJson = fs.readFileSync(dataDir + 'all-test-summary.json', { encoding: 'utf8' });
   const summaryStats = JSON.parse(summaryJson);

   if (summaryStats.disconnected) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭 GOT A DISCONNECTED IN THE REPORTER RESULTS');
      console.error('Browsers disconnected. Build failed.');
   }

   if (summaryStats.error || summaryStats.failed) {
      /* eslint-disable no-console */
      console.log('😭😡😭 😭😡😭 😭😡😭 😭😡😭 GOT AN ERROR IN THE REPORTER RESULTS');
      console.error(summaryStats.failed + ' test errors. Build failed.');
   }
}

// Print out a message for each set of duplicate test names found in the results
function reportDuplicateTestNames(browserResults) {
   let shownHeader = false;

   browserResults.map((result) => {
      if (!result.duplicates) {
         return;
      }

      if (!shownHeader) {
         console.error('DUPLICATE TEST NAMES\n');
         shownHeader = true;
      }
      console.error('Browser: ' + result.browserName + '\n');
      console.error(result.duplicates + '\n');
   });
}

/*
 * Given the options, find the test summary files. Report on any duplicate
 * test names, and write out a table of the results for all browsers.
 * Options:
 *   reportDir
 *   testFileName
 *   summaryFile
 */
function testReport(options) {
   const summaryFile = options.summaryFile || DEFAULT_SUMMARY_FILE;
   const reportsRoot = options.reportDir || DEFAULT_REPORTS_DIR;
   const testFileName = options.testFileName || DEFAULT_REPORT_NAME;

   if (!fs.existsSync(reportsRoot)) {
      console.error('Could not find the directory to look for rest reports: ' + reportsRoot);
      return;
   }

   const resultFiles = glob.sync(reportsRoot + '/**/' + testFileName);
   const browserResults = resultFiles.map(processResultsPerBrowser);

   const table = tableFormatter(browserResults, { column: COLUMNS });

   fs.writeFileSync(summaryFile, table, 'UTF-8');

   reportDuplicateTestNames(browserResults);
   reportOnSummaryInfo(reportsRoot);
}

module.exports = testReport;
