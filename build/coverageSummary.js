'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');

getSummaryPaths('../temp');
//var resultsx = fs.readFileSync('../temp/nodeCoverage/coverage-summary.json', { encoding: 'utf8' });
//var results = fs.readFileSync('../temp/testCoverage/Chrome 53.0.2785 (Mac OS X 10.12.0)/coverage-summary.json',
// { encoding: 'utf8' });
//
//var objects = JSON.parse(results).total;
//
//var totalPercent = objects.lines.pct + objects.statements.pct + objects.functions.pct + objects.branches.pct;
//
//console.log(totalPercent);

function getSummaryPaths(dir) {
   var files = fs.readdirSync(dir);

   for (var index = 0; index < files.length; index++) {
      var fullPath = dir + '/' + files[index];
      var stats = fs.statSync(fullPath);
      if (stats.isFile()) {
         if (files[index] === 'coverage-summary.json') {
            console.log('#' + fullPath);
            var results = fs.readFileSync(fullPath, { encoding: 'utf8' });
            var objects = JSON.parse(results).total;
            var total = objects.lines.pct + objects.statements.pct + objects.functions.pct + objects.branches.pct;

            console.log(total);
         }
      } else if (stats.isDirectory()) {
         getSummaryPaths(fullPath);
      }
   }

}
