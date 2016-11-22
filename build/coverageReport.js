'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');

var COVERAGE_FILENAME = 'coverage-summary.json';
var OS_REGEX = /^(.*) \(.*\)$/;

function stripOs(name) {
   var results = OS_REGEX.exec(name);
   return results[1];
}

function getSummaryPaths(dir, parentName, totals) {
   var files = fs.readdirSync(dir);

   for (var index = 0; index < files.length; index++) {
      var fullPath = dir + '/' + files[index];
      var stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
         getSummaryPaths(fullPath, files[index], totals);
      } else if (stats.isFile()) {
         if (files[index] === COVERAGE_FILENAME) {
            var coverageSummary = fs.readFileSync(fullPath, { encoding: 'utf8' });
            var tls = JSON.parse(coverageSummary).total;
            var total = (tls.lines.pct + tls.statements.pct + tls.functions.pct + tls.branches.pct) / 4;
            var entry = totals[total] || [];

            entry.push(stripOs(parentName));
            totals[total] = entry;
         }
      }
   }
}

module.exports = (grunt) => {

   function coverageReport() {

      var exists = fs.existsSync(this.data.dir);
      if (!exists) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + this.data.dir);
         return;
      }

      var totals = {};

      getSummaryPaths(this.data.dir, this.data.dir, totals);

      var keys = Object.keys(totals);
      var failed = false;

      for (var index = 0; index < keys.length; index++) {
         if (keys[index] !== '100') {
            failed = true;
         }
         process.passthroughWrite(keys[index] + '%: ' + totals[keys[index]].join(', ') + '\n');
      }

      if (failed) {
         grunt.fail.fatal('coveragereport: Did not get 100% code coverage. Build failed');
      }
   }

   grunt.registerMultiTask('coveragereport', 'Produces a summary of all test coverage', coverageReport);
};
