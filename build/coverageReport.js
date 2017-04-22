'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

const fs = require('fs');
const path = require('path');

const tableFormatter = require('./text-table-formatter.js');
const util = require('./util.js');

const COVERAGE_FILENAME = 'coverage-summary.json';

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
   name: 'lines',
   units: 'l',
   alignChar: '/'
}, {
   name: 'branches',
   units: 'b',
   alignChar: '/'
}, {
   name: 'statements',
   units: 's',
   alignChar: '/'
}, {
   name: 'functions',
   units: 'f',
   alignChar: '/'
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
      branches: 0
   };
   const covered = {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0
   };

   var coverageSummary = fs.readFileSync(coverageFileName, { encoding: 'utf8' });
   var jsonData = JSON.parse(coverageSummary);

   for (var filePath in jsonData) {
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
      covered
   };
}

function calculatePercentage(info) {
   var total = 0;

   for (var lineBranchEtcKey in info.count) {
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

function makeReport(grunt, options) {
   if (!fs.existsSync(options.dir)) {
      grunt.log.error('Could not find the directory to look for coverage reports: ' + options.dir);
      return;
   }

   // Identify which files we should skip. Remove leading dot if present
   let filesToSkip = grunt.file.expand(options.filesToSkip) || [];
   filesToSkip = filesToSkip.map((fileName) => fileName.replace('./', '/'));

   // Get all the coverage files to examine
   const coverageFilename = options.coverageFileName || COVERAGE_FILENAME;
   const coverageFiles = grunt.file.expand(options.dir + '/**/' + coverageFilename);

   var failed = false;

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

   const table = tableFormatter(results, { columns: COLUMNS });

   if (options.summaryFile) {
      fs.writeFileSync(options.summaryFile, table, 'UTF-8');
   } else {
      grunt.log.write(table);
   }

   if (failed) {
      grunt.log.error(table);
      grunt.fail.fatal('Did not get 100% code coverage. Build failed');
   }
}

module.exports = (grunt) => {

   function makeCoverageReport() {
      makeReport(grunt, this.options()); // 'this' is the object that grunt attaches the task to
   }

   grunt.registerMultiTask('coveragereport', 'Produces a summary of all test coverage', makeCoverageReport);
};
