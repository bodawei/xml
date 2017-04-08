'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');
var process = require('process');

var COVERAGE_FILENAME = 'coverage-summary.json';
var OS_REGEX = /^(.*) \(.*\)$/;

function stripOs(name) {
   var results = OS_REGEX.exec(name);
   return results[1];
}

function getSummaryPaths(dir, parentName, filesToSkip, totalsAccumulator) {
   var totals = {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0
   };
   var covered = {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0
   };
   var files = fs.readdirSync(dir);

   for (var index = 0; index < files.length; index++) {
      var fullPath = dir + '/' + files[index];
      var stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
         getSummaryPaths(fullPath, files[index], filesToSkip, totalsAccumulator);
      } else if (stats.isFile()) {
         if (files[index] === COVERAGE_FILENAME) {
            var coverageSummary = fs.readFileSync(fullPath, { encoding: 'utf8' });
            var jsonData = JSON.parse(coverageSummary);

            for (var key in jsonData) {

               if (key === 'total' || filesToSkip.includes(key)) {
//                  console.log('Skipping :' + key);
                  continue;
               }

               totals.lines += jsonData[key].lines.total;
               covered.lines += jsonData[key].lines.covered;

               totals.statements += jsonData[key].statements.total;
               covered.statements += jsonData[key].statements.covered;

               totals.functions += jsonData[key].functions.total;
               covered.functions += jsonData[key].functions.covered;

               totals.branches += jsonData[key].branches.total;
               covered.branches += jsonData[key].branches.covered;
            }
            totalsAccumulator[stripOs(parentName)] = {
               totals: totals,
               covered: covered
            };
         }
      }
   }
}

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

module.exports = (grunt) => {
   function coverageReport() {
      var options = this.options();
      var exists = fs.existsSync(options.dir);
      if (!exists) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + options.dir);
         return;
      }

      var filesToSkip = [];

      if (options.filesToSkip) {
         filesToSkip = grunt.file.expand(options.filesToSkip);
         var newSkip = [];

         for (var ctr = 0; ctr < filesToSkip.length; ctr++) {
            newSkip.push(filesToSkip[ctr].replace('./', ''));
            newSkip.push(process.cwd() + '/' + filesToSkip[ctr].replace('./', ''));
         }
         filesToSkip = newSkip;
      }

      var totals = {};

      getSummaryPaths(options.dir, options.dir, filesToSkip, totals);

      var keys = Object.keys(totals);
      var failed = false;
      var sortedNames = [];

      var info = keys.map((key) => {
         var browserMatch = /([A-Za-z]+) [v]?([0-9\.]+)/.exec(key);
         var browserName = browserMatch[1];
         var browserVersion = browserMatch[2];
//         var osMatch = /^([^0-9]+) ([0-9\.]+)/.exec(result.os);

         sortedNames.push(browserName);
         var percentage = calculatePercentage(totals[key]);
         if (percentage !== 100) {
            failed = true;
         }

         return {
            name: browserName,
            percentage: percentage + '%',
            version: browserVersion
         };
      });

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

   grunt.registerMultiTask('coveragereport', 'Produces a summary of all test coverage', coverageReport);
};
