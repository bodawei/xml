/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

var BASE_PATH = process.cwd();
var BUILD_DIR = BASE_PATH + '/build/';
var SOURCE_DIR = BASE_PATH + '/source/';

// http://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function karmaConfig(config) {
   // Need to configure this 'externally' for the dynamic key. note: Order matters
   const prepro = {};
   prepro[SOURCE_DIR + '**/*.js'] = [ 'karma-typescript' ];
   prepro[BUILD_DIR + '*.js'] = [ 'karma-typescript' ];
   prepro[SOURCE_DIR + '**/*.ts'] = [ 'karma-typescript' ];
   prepro[BUILD_DIR + '*.ts'] = [ 'karma-typescript' ];

   config.set({
      basePath: './',
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      reportSlowerThan: 200,
      browsers: [],
      captureTimeout: 20000,     // If browser does not capture in given timeout [ms], kill it
      autoWatch: false,
      singleRun: true,
      files: [
         BUILD_DIR + '**/*.jasmine*.js',
         BUILD_DIR + '**/*.test.js',
         SOURCE_DIR + '**/*.js',
         SOURCE_DIR + '**/*.ts',
      ],
      exclude: [
      ],
      preprocessors: prepro,   // See the setup of this below.
      frameworks: [
         'jasmine',
         'karma-typescript',  // while this is loaded either way, it needs to be listed here for some reason
      ],

      reporters: [ 'progress', 'karma-typescript' ],

      karmaTypescriptConfig: {
         tsconfig: '../tsconfig.json',
         bundlerOptions: {
            sourceMap: true,
            transforms: [
               require('karma-typescript-es6-transform')({ // eslint-disable-line global-require
                  presets: [ 'es2015', 'es2016', 'es2017' ],
               }),
            ],
         },
         coverageOptions: {
            // Exclude both .js an .ts test files from the coverage reports
            exclude: /\.(d|spec|test)\.(ts|js)$/i,
         },
         reports: {
            html: './temp/clap-coverage/html-report',
            json: './temp/clap-coverage/json-report',
         },
      },
   });

};
