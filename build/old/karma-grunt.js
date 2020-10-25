/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

var isparta = require('isparta');

var BASE_PATH = process.cwd();
var OUT_DIR = BASE_PATH + '/temp/';
var BUILD_DIR = BASE_PATH + '/build/';
var SOURCE_DIR = BASE_PATH + '/source/';

// var xBABEL_PRESETS = [ ['env', {
//    targets: {
//       chrome: 58
//    }
// } ] ];

var BABEL_PRESETS = [ 'es2015', 'es2016', 'es2017' ];

// http://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function karmaConfig(config) {
   config.set({
      basePath: './',
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      reportSlowerThan: 200,
      browsers: [ 'HeadlessChrome' ],
      captureTimeout: 20000,     // If browser does not capture in given timeout [ms], kill it
      autoWatch: false,
      singleRun: true,
      files: [
         BUILD_DIR + '**/*.jasmine*.js',
         BUILD_DIR + '**/*.test.js',
         SOURCE_DIR + '**/*.js',
      ],
      exclude: [
      ],
      preprocessors: {},   // See the setup of this below.
      frameworks: [ 'jasmine', 'browserify' ],
      // https://github.com/Nikku/karma-browserify
      browserify: {
         debug: true,
         watch: true,
         configure: (bundle) => {
            bundle.require('../node_modules/buffer/index.js', {expose: 'buffer' });
         },
         transform: [
            [ 'babelify', { presets: BABEL_PRESETS } ],
            [ 'browserify-istanbul', {
               ignore: '**/*.test.js',
               instrumenter: isparta,
               // bf magic: https://github.com/karma-runner/karma-coverage/issues/157#issuecomment-129636012
               instrumenterConfig: {
                  embedSource: true,
               },
            } ],
         ],
      },
      reporters: [ 'progress', 'junit', 'coverage', 'yajson' ],

      junitReporter: {
         outputDir: OUT_DIR + 'testResults',
      },

      // https://github.com/bodawei/karma-yajson-reporter
      yaJsonReporter: {
         dirPath: OUT_DIR + 'testResults',
         fileName: 'test-summary.json',
         separator: ' • ',
      },
      // https://github.com/karma-runner/karma-coverage
      coverageReporter: {
         dir : OUT_DIR + 'testCoverage/',
         reporters: [
            { type: 'json', file: 'coverage.json' },
            { type: 'json-summary', file: 'coverage-summary.json' },
            { type: 'html', subdir: 'report-html' },
            { type: 'text', subdir: '.', file: 'text.txt' },
         ],
      },
   });

   // Need to configure this "externally" for the dynamic key. note: Order matters
   config.preprocessors[SOURCE_DIR + '/**/*.js'] = [ 'browserify' ];
   config.preprocessors[SOURCE_DIR + '/*.js'] = [ 'coverage' ];
   config.preprocessors[BUILD_DIR + '/**/*.js'] = [ 'browserify' ];
   config.preprocessors[BUILD_DIR + '*.js'] = [ 'coverage' ];
};
