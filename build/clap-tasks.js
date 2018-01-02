/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env node */
/* eslint-disable no-console */

const fs = require('fs');
const os = require('os');
const path = require('path');

const deriveLocale = require('./tool/deriveLocale.js');
const coverageReport = require('./tool/coverageReport.js');
const testReport = require('./tool/testReport.js');

/**********************************************************************\
 * Constants
\**********************************************************************/

const BUILD_DIR = path.join(__dirname, '../build/');
const SOURCE_DIR = path.join(__dirname, '../source/');
const DIST_DIR = path.join(__dirname, '../dist/');
const OUT_DIR = path.join(__dirname, '../temp/');

const NODE_MODULES_DIR = path.join(__dirname, '../node_modules');

const DIST_LIB_DIR = path.join(DIST_DIR, 'lib/');
const DIST_PACKAGE_DIR = path.join(DIST_DIR, 'x2js/');
const SOURCE_LOCALE_DIR = path.join(__dirname, '../source/error/locale/');
const SOURCE_DERIVED_DIR = path.join(__dirname, '../source/error/derive/');
const NODE_COVERAGE_DIR = path.join(OUT_DIR, `coverage/node ${process.version} (${os.type()} ${os.release()})/`);

const JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js',
];

let BROWSERS;
// Figure out what browsers we should be able to run on the current platform.
if (/darwin/.test(process.platform)) {
   BROWSERS = [ 'Chrome', 'Firefox', 'Opera', 'PhantomJS', 'Safari', 'Vivaldi' ];
} else if (/^win/.test(process.platform)) {
   BROWSERS = [ 'Brave', 'Chrome', 'Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Vivaldi' ];
} else {
   console.error('Unknown or unsupported platform. Please add support for it with a pull request.');
}

/**********************************************************************\
 * Utils
\**********************************************************************/

function deLf(str) {
   return str.replace(/\n/g, ' ').replace(/[ ]+/g, ' ');
}

/**********************************************************************\
 * Tasks
\**********************************************************************/

const setupTeardown = {
   _setup: deLf(`
      mkdir -p ${OUT_DIR};
      mkdir -p ${DIST_DIR};
      mkdir -p ${DIST_LIB_DIR};
      mkdir -p ${DIST_PACKAGE_DIR};
   `),

   _clean: `rm -rf ${OUT_DIR} ${DIST_DIR} ${SOURCE_DERIVED_DIR}`,

   _deepClean: [
      'clean',
      () => `rm -rf ${NODE_MODULES_DIR};`,
   ],
};

const check = {
   _eslint: deLf(`eslint
      --config    ${BUILD_DIR}/eslint/eslintrc.js
      --rulesdir  ${BUILD_DIR}/eslint/customEslintRules
      --cache
      --cache-location ${OUT_DIR}/eslintCache
      ${JS_FILE_GLOB.join(' ')}
   `),
};

const build = {
   _deriveLocale: () => deriveLocale({
      sourceDir: SOURCE_LOCALE_DIR,
      destDir: SOURCE_DERIVED_DIR,
   }),

   // This is pretty much a joke
   _buildPackage: deLf(`
      cp -R source/* ${DIST_PACKAGE_DIR};
      find ${DIST_PACKAGE_DIR} -name "*.test.js" -exec rm {} \\;
   `),

   // This is sorta a joke
   _buildES5Files: 'tsc --project build/typescript/dist.json',
};

const report = {
   _makeCoverageSummary: () => coverageReport({
      // filesToSkip: [ ],
      reportDir: OUT_DIR + '/coverage',
      coverageFileName: 'coverage-summary.json',
      summaryFile: path.join(OUT_DIR, './coverage-summary.txt'),
   }),

   _makeTestSummary: () => testReport({
      reportDir: OUT_DIR + '/testResults/',
      testFileName: 'test-summary.json',
      summaryFile: path.join(OUT_DIR, './test-summary.txt'),
   }),

   // Not used right now.
   _printTestResults: () => {
      console.log('Style Checks passed');
      console.log('Full coverage details in: : file://' + process.cwd() +
         '/temp/coverage/Phantom*/html/index.html');
      console.log('Coverge summary:');
   },

   _printTestAndCoverageSummaries:  () => {
      const coverageReport = fs.readFileSync(path.join(OUT_DIR, './coverage-summary.txt'));
      const testReport = fs.readFileSync(path.join(OUT_DIR, './test-summary.txt'));

      console.log('TEST');
      console.log(testReport.toString());
      console.log('\nCOVERAGE');
      console.log(coverageReport.toString());
   },
};

const test = {
   _karmaPrecommit: `karma start ${BUILD_DIR}/karma-precommit.js --browsers ${BROWSERS.join(',')}`,
   _karmaLive: `karma start ${BUILD_DIR}/karma-live.js --browsers ChromeHeadless`,

   // NOTE!  This does not yet run with typescript at all.
   _nodeTest: `nyc --require="babel-register" --report-dir="${NODE_COVERAGE_DIR}" jasmine --config=build/jasmine.json`,
};

const publicInterface = {
   clean: [ '_clean' ],
   deep: [ '_deepClean' ],
   live: [
      '_setup',
      '_deriveLocale',
      '_karmaLive',
   ],
   precommit: [
      '_clean',
      '_setup',
      '_deriveLocale',
      '_eslint',
      '_nodeTest',
      '_karmaPrecommit', // Arguably should be running the dist/ code
      // '_buildPackage',
      // '_buildES5Files',
      '_makeCoverageSummary',
      '_makeTestSummary',
      '_printTestAndCoverageSummaries',
   ],
   karma2: 'karma start ./build/karmaConfig.clap.js',
   karma3: `karma start ${BUILD_DIR}/karma/karmaConfig.clap.js`,
   karma4: `karma start ${BUILD_DIR}/live.js`,
   karma5: `karma start ${BUILD_DIR}/karma/live.js`,
};

module.exports = Object.assign({},
   check,
   setupTeardown,
   build,
   report,
   test,
   publicInterface
);
   // "compilerOptions": {
   //    "allowJs": true,
   //    "target": "es5",
   //    "sourceMap": true,
   //    "outDir": "./temp/typescript"
   // },
   // "include": [
   //    "build/**/*jasmine*.js",
   //    "source/**/*.js",
   //    "build/**/*jasmine*.ts",
   //    "source/**/*.ts"
   // ]
// {
//     "compilerOptions": {
//       "allowJs": true,
//       "target": "es5",
//       "sourceMap": true,
//       "outDir": "./temp/typescript"
//     },
//     "include": [
//         "source/**/*.js"
//     ],
//     "exclude": [
//         "node_modules",
//     ]
// }

