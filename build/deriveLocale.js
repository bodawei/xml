/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */

'use strict';

const fs = require('fs');
const propertiesParser = require('node-properties-parser');

const CODE_FILE = 'code.properties';
const BASE_FILE = 'base.properties';

/**********************************************************************\
 Take the .properties file in a source directory, validate them and then
 generate a set of JSON files built from them.

 This is not a general purpose process that would be usable beyond the
 scope of this project. See the individual functions below for more
 details
\**********************************************************************/
module.exports = (grunt) => {

   /**********************************************************************\
    Validate that none of the values in the specified objects are
    identical with other values. Report an error if this is found.

    This keeps us from, for example, accidentally getting the same error
    code for two entries
   \**********************************************************************/

   function noDupValues(obj, fileName) {
      const testObj = {};

      for (const key in obj) {
         const value = obj[key];

         if (testObj[value]) {
            grunt.log.fail('Duplicate value in ' + fileName + ': ' + value);
         } else {
            testObj[value] = true;
         }
      }
   }

   /**********************************************************************\
    Validate that all the keys in source are also found in other.  If not
    found, report an error.

    This makes sure that someone hasn't added, for example, an error code
    without also creating an entry for the same in the string properties.
   \**********************************************************************/

   function haveSameKeys(source, other, otherName) {
      for (const key in source) {
         if (!other[key]) {
            grunt.log.fail('Missing key "' + key + '" in ' + otherName);
         }
      }
   }

   /**********************************************************************\
    Validate that the two objects (left and right) have identical sets of
    keys
   \**********************************************************************/

   function keysMatch(left, leftName, right, rightName) {
      haveSameKeys(left, right, rightName);
      haveSameKeys(right, left, leftName);
   }

   /**********************************************************************\
    For one set of localized values, make sure they meet various
    constraints, including:
      - no duplciate error codes
      - the keys in the base and codes files match
    then write the data out in a JSON format, excluding the keys that have
    a value of "OBSOLETE" in the base file.

    The obsolete values are kept because it assures we will never reuse a
    code or key accidentally in the future.
   \**********************************************************************/

   function doLocaleSet(sourceDir, destDir, setName) {
      const baseStrings = fs.readFileSync(sourceDir + BASE_FILE);
      const baseObject = propertiesParser.parse(baseStrings);
      const codes = fs.readFileSync(sourceDir + CODE_FILE);
      const codesObject = propertiesParser.parse(codes);
      const jsonBase = {};
      const jsonCode = {};
      const names = {};

      noDupValues(codesObject, CODE_FILE);
      keysMatch(baseObject, BASE_FILE, codesObject, CODE_FILE);

      for (const key in baseObject) {
         const value = baseObject[key];

         if (value !== 'OBSOLETE') {
            jsonBase[key] = value;
            jsonCode[key] = parseInt(codesObject[key], 10);
            names[key] = key;
         }
      }

      if (!fs.existsSync(destDir)) {
         fs.mkdirSync(destDir);

         if (!fs.existsSync(destDir + '/' + setName)) {
            fs.mkdirSync(destDir + '/' + setName);
         }
      }

      //const fileContents = '/* Copyright ® 2016-2017 by David John Burrowes.
      // All rights reserved. */\n' +
      //   '\'use strict\';\n' +
      //   'const StringBundle = require(\'../shared/StringBundle.js\');\n' +
      //   'const XmlError = require(\'../error/XmlError.js\');\n' +
      //   'class ' + setName + ' extends XmlError {}\n' +
      //   setName + '.ID = ' + JSON.stringify(names, undefined, 3) + ';\n' +
      //   setName + '.CODE = ' + JSON.stringify(jsonCode, undefined, 3) + ';\n' +
      //   setName + '.STRING = new StringBundle(' +
      // JSON.stringify({ base: jsonBase }, undefined, 3) + ');\n' +
      //   'module.exports = ' + setName + ';\n';
      //
      //fs.writeFileSync(destDir + '/' + setName + '.js', fileContents);
      fs.writeFileSync(destDir + '/' + setName + '.json', JSON.stringify({ base: jsonBase }, undefined, 2));
      fs.writeFileSync(destDir + '/' + setName + '-code.json', JSON.stringify(jsonCode, undefined, 2));
   }

   /**********************************************************************\
    This assumes that given a directory structure like:
      sourceDir/
         dir1/
            base.properties
            code.properties
         dir2/
            base.properties
            code.properties
    that we want to generate
      destDir/
         dir1.json
         dir1-code.json
    The purpose of this is to get a set of strings and codes associated
    with a particular class (as named by dir1, dir2, etc)
   \**********************************************************************/

   function derivelocale() {
      const options = this.options();

      const contents = fs.readdirSync(options.sourceDir);

      for (let index = 0; index < contents.length; index++) {
         const stats = fs.statSync(options.sourceDir + '/' + contents[index]);
         if (stats.isDirectory()) {
            doLocaleSet(options.sourceDir + '/' + contents[index] + '/', options.destDir, contents[index]);
         }
      }
   }

   grunt.registerMultiTask('derivelocale', 'Derive locale JSON files', derivelocale);
};
