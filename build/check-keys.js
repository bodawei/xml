/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, global-require */

'use strict';

var propertiesParser = require('node-properties-parser');

/*
 * This defines a task that will examine all the keys in a set of property
 * files are being referenced in a set of source files.
 *
 * The intended purpose is to verify that a set of i18N keys are, in fact,
 * all being referenced so as to avoid "dead" keys.
 *
 * To use, set up a configuration like this:
 *   checkkeys: {
 *      default: {
 *         src: './**.js',   // source files to look for use of the keys
 *         options: {
 *            propFiles: './** /base.properties' // the file(s) with keys
 *         }
 *       }
 *   }
 * propFiles and src can be any glob value
 */

module.exports = (grunt) => {

   grunt.registerMultiTask('checkkeys', 'Validate that all property keys are being used.', function checkKeys() {
      var options = this.options();
      var sourceFileData = [];
      var results = [];

      if (!options.propFiles) {
         grunt.fail.fatal('Must specify a globbing pattern for "propFiles". ' +
            'e.g. checkkeys: { default: options: { propFiles: ./**/*.properties }}.');
         return;
      }
      if (this.filesSrc.length == 0) {
         grunt.fail.fatal('Must specify source files to examine.');
      }

      var propFiles = grunt.file.expand(options.propFiles);

      /* read in all the source files. We will iterate over each multiple times,
       * so it will be better to get them all in once
       */
      this.filesSrc.forEach((pathname) => {
         if (!grunt.file.exists(pathname)) {
            return;
         }
         sourceFileData.push(grunt.file.read(pathname));
      });

      /* examine each property file, and (in memory) delete each key as we find
       * it being used. This lets us identify the keys not being used while also
       * reducing the number of iterations that need to be done.
       */
      propFiles.forEach((propertyFile) => {
         if (!grunt.file.exists(propertyFile)) {
            return;
         }
         var propertyData = grunt.file.read(propertyFile);
         var propertyObject = propertiesParser.parse(propertyData);

         sourceFileData.forEach((fileData) => {
            for (var key in propertyObject) {
               if (fileData.indexOf(key) !== -1) {
                  delete propertyObject[key];
               }
            }
         });

         if (Object.keys(propertyObject).length > 0) {
            results.push('These keys from ' + propertyFile + ' are not being used: ' +
               Object.keys(propertyObject).join(', '));
         }
      });

      if (results.length > 0) {
         grunt.fail.fatal(results.join('\n'));
      }
   });

};
