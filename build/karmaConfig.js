/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

'use strict';

var isparta = require('isparta');

var BASE_PATH = process.cwd();
var OUT_DIR = BASE_PATH + '/temp/';
var SOURCE_DIR = BASE_PATH + '/source/';
var BUILD_DIR = BASE_PATH + '/build/';

// http://karma-runner.github.io/0.13/config/configuration-file.html
module.exports = function karmaConfig(config) {
   config.set({
      basePath: './',
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      reportSlowerThan: 200,
      browsers: [ 'PhantomJS2' ],
      captureTimeout: 20000,     // If browser does not capture in given timeout [ms], kill it
      autoWatch: false,
      singleRun: true,
      files: [
         SOURCE_DIR + '**/*.js'
      ],
      exclude: [],
      preprocessors: {},   // See the setup of this below.
      frameworks: [ 'jasmine', 'browserify' ],
      // https://github.com/Nikku/karma-browserify
      browserify: {
         debug: true,
         watch: true,
         transform: [
            [ 'babelify', {presets: [ 'es2015' ]} ],
            [ 'browserify-istanbul', {
               ignore: '**/*.test.js',
               instrumenter: isparta
            } ]
         ]
      },
      reporters: [ 'progress', 'junit', 'coverage' ],
      junitReporter: {
         outputDir: OUT_DIR + 'testResults'
      },
      // https://github.com/karma-runner/karma-coverage
      coverageReporter: {
         instrumenters: { isparta : isparta },
         instrumenter: {
            '**/*.js': 'isparta'
         },
         instrumenterOptions: {
            isparta: { babel : { presets: [ 'es2015' ] } }
         },
         dir : OUT_DIR + 'testCoverage/',
         reporters: [
            { type: 'html', subdir: 'report-html' },
            { type: 'text', subdir: '.', file: 'text.txt' }
         ]
      }
   });

   // Need to configure this "externally" for the dynamic key
   config.preprocessors[BUILD_DIR + '*.js'] = [ 'coverage' ];
   config.preprocessors[SOURCE_DIR + '*.js'] = [ 'coverage' ];
   config.preprocessors[SOURCE_DIR + '/**/*.js'] = [ 'browserify' ];
   config.preprocessors[BUILD_DIR + '/jasmineSetup*'] = [ 'browserify' ];
};
