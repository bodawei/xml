const fs = require('fs');
const path = require('path');

const xclap = require('xclap');

const deriveLocale = require('./build/tool/deriveLocale.js');
const coverageReport = require('./build/tool/coverageReport.js');
// var testReport = require('./build/tool/testReport.js');

const BUILD_DIR = './build/';
const SOURCE_DIR = './source/';
const SOURCE_LOCALE_DIR = './source/locale/';
const SOURCE_DERIVED_DIR = './source/derive/';
const NODE_MODULES_DIR = './node_modules';
const OUT_DIR = './temp/';
const DIST_DIR = './dist/';

const JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js'
];



const tasks = {
   karma: 'karma start ./build/karmaConfig.js',

   eslint: `eslint
      --config    ${BUILD_DIR}/style/eslintrc.js
      --rulesdir  ${BUILD_DIR}/style/customEslintRules
      ${JS_FILE_GLOB.join(' ')}
   `.replace(/\n/g, ' '),

   clean: `
      rm -rf ${OUT_DIR};
      rm -rf ${DIST_DIR};
      rm -rf ${SOURCE_DERIVED_DIR};
      `.replace(/\n/g, ' '),

   deepClean: [ 'clean', () => `rm -rf ${NODE_MODULES_DIR};` ],

   setup: `
      mkdir -p ${OUT_DIR};
      mkdir -p ${DIST_DIR};
      `.replace(/\n/g, ' '),

   dumpReports:  () => {
      const coverageReport = fs.readFileSync(path.join(OUT_DIR, './coverage-summary.txt'));
      const testReport = fs.readFileSync(path.join(OUT_DIR, './test-summary.txt'));

      console.log('TEST');
      console.log(testReport.toString());
      console.log('\nCOVERAGE');
      console.log(coverageReport.toString());
   },

   it: [
//      'clean',
      'setup',
      () => deriveLocale({
         sourceDir: SOURCE_LOCALE_DIR,
         destDir: SOURCE_DERIVED_DIR,
      }),
      'eslint',
      () => coverageReport({
         // filesToSkip: [ ],
         reportDir: OUT_DIR,
         coverageFileName: 'coverage-summary.json',
         summaryFile: path.join(OUT_DIR, './coverage-summary.txt'),
      }),
      'dumpReports'
   ]
};
xclap.load(tasks);
