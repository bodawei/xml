/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

'use strict';

var isparta = require('isparta');

var BASE_PATH = process.cwd();
var OUT_DIR = BASE_PATH + '/temp/';
var BUILD_DIR = BASE_PATH + '/build/';
var SOURCE_DIR = BASE_PATH + '/source/';

var BABEL_PRESETS = 'es2015';

// http://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function karmaConfig(config) {
   config.set({
      basePath: './',
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      reportSlowerThan: 200,
      browsers: [ 'PhantomJS' ],
      captureTimeout: 20000,     // If browser does not capture in given timeout [ms], kill it
      autoWatch: false,
      singleRun: true,
      files: [
         BUILD_DIR + '**/*.jasmine*.js',
         BUILD_DIR + '**/*.test.js',
         SOURCE_DIR + '**/*.js'
      ],
      exclude: [],
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
            [ 'browserify-istanbul', {
               ignore: '**/*.test.js',
               instrumenter: isparta
            } ],
            [ 'babelify', {presets: [ BABEL_PRESETS ]} ]
         ]
      },
      reporters: [ 'progress', 'junit', 'coverage', 'yajson' ],

      junitReporter: {
         outputDir: OUT_DIR + 'testResults'
      },

      // https://github.com/bodawei/karma-yajson-reporter
      yaJsonReporter: {
         dirPath: OUT_DIR + 'testResults',
         fileName: 'test-summary.json',
         separator: ' • '
      },
      // https://github.com/karma-runner/karma-coverage
      coverageReporter: {
         dir : OUT_DIR + 'testCoverage/',
         reporters: [
            { type: 'json', file: 'coverage.json' },
            { type: 'json-summary', file: 'coverage-summary.json' },
//            { type: 'html', subdir: 'report-html' },
            { type: 'text', subdir: '.', file: 'text.txt' }
         ]
      }
   });

   // Need to configure this "externally" for the dynamic key. note: Order matters
   config.preprocessors[SOURCE_DIR + '/**/*.js'] = [ 'browserify' ];
   config.preprocessors[SOURCE_DIR + '/*.js'] = [ 'coverage' ];
   config.preprocessors[SOURCE_DIR + '/error/*.js'] = [ 'coverage' ];
   config.preprocessors[SOURCE_DIR + '/shared/*.js'] = [ 'coverage' ];
   config.preprocessors[SOURCE_DIR + '/meta/*.js'] = [ 'coverage' ];
   config.preprocessors[BUILD_DIR + '/**/*.js'] = [ 'browserify' ];
   config.preprocessors[BUILD_DIR + '*.js'] = [ 'coverage' ];
};
