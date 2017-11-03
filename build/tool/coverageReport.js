/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-console, no-process-exit */

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const tableFormatter = require('text-table-formatter');

const util = require('./util.js');

const COVERAGE_FILENAME = 'coverage-summary.json';

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
   propName: 'lines',
   unit: 'l',
   alignChar: '/',
}, {
   propName: 'branches',
   unit: 'b',
   alignChar: '/',
}, {
   propName: 'statements',
   unit: 's',
   alignChar: '/',
}, {
   propName: 'functions',
   unit: 'f',
   alignChar: '/',
} ];

/*
 * Identify if a particular subpath is found in an array of paths
 */
function subpathInPaths(subpath, paths) {
   let found = false;

   paths.forEach((path) => {
      if (path.indexOf(subpath) !== -1) {
         found = true;
      }
   });

   return found;
}

/*
 * Read in a coverage file, and calculate total lines etc, how many lines
 * etc were covered, and skip over any files specified with filesToSkip
 */
function calculateTotals(coverageFileName, filesToSkip) {
   const count = {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0,
   };
   const covered = {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0,
   };

   const coverageSummary = fs.readFileSync(coverageFileName, { encoding: 'utf8' });
   const jsonData = JSON.parse(coverageSummary);

   for (const filePath in jsonData) {
      // one of the 'files' is named 'total'
      if (filePath === 'total' || subpathInPaths(filePath, filesToSkip)) {
         continue;
      }
      const fileInfo = jsonData[filePath];

      count.lines += fileInfo.lines.total;
      covered.lines += fileInfo.lines.covered;

      count.statements += fileInfo.statements.total;
      covered.statements += fileInfo.statements.covered;

      count.functions += fileInfo.functions.total;
      covered.functions += fileInfo.functions.covered;

      count.branches += fileInfo.branches.total;
      covered.branches += fileInfo.branches.covered;
   }

   return {
      count,
      covered,
   };
}

function calculatePercentage(info) {
   let total = 0;

   for (const lineBranchEtcKey in info.count) {
      total += (info.covered[lineBranchEtcKey] / info.count[lineBranchEtcKey]);
   }

   if (total === 0) {
      return 100;
   }

   return (total / 4) * 100;
}

function byBrowserName(a, b) {
   const lcA = a.browserName.toLocaleLowerCase();
   const lcB = b.browserName.toLocaleLowerCase();

   if (lcA > lcB) {
      return 1;
   } else if (lcA < lcB) {
      return -1;
   }

   return 0;
}

function reportFailure(message) {
   console.log(message);
   process.exit(1);
}

function makeCoverageReport(options) {
   if (!fs.existsSync(options.reportDir)) {
      reportFailure('Could not find the directory to look for coverage reports: ' + options.reportDir);
      return;
   }

   // Identify which files we should skip. Remove leading dot if present
   let filesToSkip = options.filesToSkip ? glob.sync(options.filesToSkip) : [];
   filesToSkip = filesToSkip.map((fileName) => fileName.replace('./', '/'));

   // Get all the coverage files to examine
   const coverageFilename = options.coverageFileName || COVERAGE_FILENAME;
   const coverageFiles = glob.sync(options.reportDir + '/**/' + coverageFilename);

   let failed = false;

   // Accumulate the data for all the columns
   const results = coverageFiles.map((fileName) => {
      const browserName = path.basename(path.dirname(fileName));

      const reportColumns = util.extractBrowserAndOsNames(browserName);
      const totals = calculateTotals(fileName, filesToSkip);
      reportColumns.percentage = calculatePercentage(totals);

      reportColumns.lines = totals.covered.lines + '/' + totals.count.lines;
      reportColumns.statements = totals.covered.statements + '/' + totals.count.statements;
      reportColumns.functions = totals.covered.functions + '/' + totals.count.functions;
      reportColumns.branches = totals.covered.branches + '/' + totals.count.branches;

      if (reportColumns.percentage !== 100) {
         failed = true;
      }

      return reportColumns;
   });

   results.sort(byBrowserName);

   const table = tableFormatter(results, { column: COLUMNS });

   if (options.summaryFile) {
      fs.writeFileSync(options.summaryFile, table, 'UTF-8');
   } else {
      console.log(table);
   }

   if (failed) {
      console.error(table);
      reportFailure('Did not get 100% code coverage. Build failed');
   }
}

module.exports = makeCoverageReport;
