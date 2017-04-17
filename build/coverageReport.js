'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');
var path = require('path');

var BROWSER_VERSION_OS_VERSION_SEPARATION_REGEX = /^(.*) \((.*)\)$/;

var COVERAGE_FILENAME = 'coverage-summary.json';

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
   const totals = {
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

      totals.lines += fileInfo.lines.total;
      covered.lines += fileInfo.lines.covered;

      totals.statements += fileInfo.statements.total;
      covered.statements += fileInfo.statements.covered;

      totals.functions += fileInfo.functions.total;
      covered.functions += fileInfo.functions.covered;

      totals.branches += fileInfo.branches.total;
      covered.branches += fileInfo.branches.covered;
   }

   return {
      totals,
      covered
   };
}

function makeReport(grunt) {
   const options = this.options();

   if (!fs.existsSync(options.dir)) {
      grunt.log.error('Could not find the directory to look for coverage reports: ' + options.dir);
      return;
   }

   const filesToSkip = grunt.file.expand(options.filesToSkip) || [];
   const generalizedFilesToSkip = filesToSkip.map((fileName) => fileName.replace('./', ''));
   const coverageFilename = options.coverageFileName || COVERAGE_FILENAME;
   const coverageFiles = grunt.file.expand(options.dir + '/**/' + coverageFilename);
   const resultsPerBrowser = {};

   coverageFiles.forEach((fileName) => {
      const browserName = path.basename(path.dirname(fileName));
      resultsPerBrowser[browserName] = calculateTotals(fileName, generalizedFilesToSkip);
   });

///
   const totals = resultsPerBrowser;

   var keys = Object.keys(totals);
   var failed = false;
   var sortedNames = [];

   var info = keys.map((key) => {
      const browserAndOs = BROWSER_VERSION_OS_VERSION_SEPARATION_REGEX.exec(key);
      var browserMatch = /([A-Za-z]+) [v]?([0-9\.]+)/.exec(browserAndOs[1]);
      var browserName = browserMatch[1];
      var browserVersion = browserMatch[2];
      var osMatch = /([^0-9\.]+) [v]?([0-9\.]+)/.exec(browserAndOs[2]);
      var osName = osMatch[1];
      var osVersion = osMatch[2];

      sortedNames.push(browserName);
      var percentage = calculatePercentage(totals[key]);
      if (percentage !== 100) {
         failed = true;
      }

      return {
         name: browserName,
         percentage: percentage + '%',
         version: browserVersion,
         os: osName,
         osVersion: osVersion
      };
   });

   function calculatePercentage(info) {
      var total = 0;
      for (var key in info.totals) {
         if (info.covered[key] === 0) {
            continue;
         }
         total += (info.covered[key] / info.totals[key]);
      }

      if (total === 0) {
         return 100;
      }

      return (total / 4) * 100;
   }

   var maxLengths = info.reduce((accumulation, entry) => {
      accumulation.name = Math.max(accumulation.name, entry.name.length);
      accumulation.percentage = Math.max(accumulation.percentage, entry.percentage.toString().length);
      accumulation.version = Math.max(accumulation.version, entry.version.length);
      return accumulation;
   }, { name: 0, percentage: 0, version: 0});

   function padValue(value, columnWidth, padChar) {
      let nameResult = value;
      for (let paddingSpace = value.length; paddingSpace < columnWidth; paddingSpace++) {
         nameResult += padChar || ' ';
      }

      return nameResult;
   }

   const border = [];
   let table = '';
   border.push(padValue('', maxLengths.percentage, '─'));
   border.push(padValue('', maxLengths.name, '─'));
   border.push(padValue('', maxLengths.version, '─'));
   print('┌─' + border.join('─┬─') + '─┐\n');

   sortedNames.sort();

   var byBrowser = {};
   info.forEach((entry) => {
      byBrowser[entry.name] = entry;
   });

   function print(message) {
      table += message;
   }

   for (let index = 0; index < sortedNames.length; index++) {
      const name = sortedNames[index];
      const value = [];
      value.push(padValue(byBrowser[name].percentage, maxLengths.percentage));
      value.push(padValue(byBrowser[name].name, maxLengths.name));
      value.push(padValue(byBrowser[name].version, maxLengths.version));
      value.push(padValue(byBrowser[name].os, maxLengths.version));
      value.push(padValue(byBrowser[name].osVersion, maxLengths.version));
      print('│ ' + value.join(' │ ') + ' │\n');
   }
   print('└─' + border.join('─┴─') + '─┘\n');

   if (options.summaryFile) {
      fs.writeFileSync(options.summaryFile, table, 'UTF-8');
   } else {
      grunt.log.write(table);
   }
//      for (var index = 0; index < keys.length; index++) {
//         var browserName = keys[index];
//         var percentage = calculatePercentage(totals[browserName]);
//         if (percentage !== 100) {
//            failed = true;
//         }
//
//         if (process.passthroughWrite) {
//            process.passthroughWrite(percentage + '%: ' + browserName + '\n');
//         } else {
//            console.log(percentage + '%: ' + browserName);
//         }
//      }

   if (failed) {
      grunt.log.error(table);
      grunt.fail.fatal('Did not get 100% code coverage. Build failed');
   }
}

module.exports = (grunt) => {

   function makeCoverageReport() {
      makeReport.call(this, grunt); // 'this' is the object that grunt attaches the task to
   }

   grunt.registerMultiTask('coveragereport', 'Produces a summary of all test coverage', makeCoverageReport);
};
