'use strict';

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, no-console */

var fs = require('fs');

module.exports = (grunt) => {

   function testReport() {
      var exists = fs.existsSync(this.data.dir);
      if (!exists) {
         grunt.log.error('Could not find the directory to look for coverage reports: ' + this.data.dir);
         return;
      }

      var testSummary = fs.readFileSync(this.data.dir + 'total-summary.json', { encoding: 'utf8' });

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
