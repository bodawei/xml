/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

const base = require('./karma/base.js');

var BASE_PATH = process.cwd();
const OUT_DIR = BASE_PATH + '/temp/';

module.exports = function karmaConfig(config) {
   const theConfig = Object.assign({}, base, {
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG

      reporters: [ 'progress', 'karma-typescript', 'yajson' ],

      // https://github.com/bodawei/karma-yajson-reporter
      yaJsonReporter: {
         dirPath: OUT_DIR + 'testResults',
         fileName: 'test-summary.json',
         separator: ' • ',
      },

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
            watermarks: { // doesn't seem to do anything
               statements: [ 99, 100 ],
               functions: [ 99, 100 ],
               branches: [ 99, 100 ],
               lines: [ 99, 100 ]
             }
         },
         reports: {
            json: {
               directory: './temp/coverage',
               filename: 'details.json',
            },
            'json-summary': {
               directory: './temp/coverage',
               filename: 'coverage-summary.json',
            },
            html: {
               directory: './temp/coverage',
            },
            text: {
               directory: './temp/coverage',
               filename: 'summary.text',
            },
         },
      },
      coverageReporter: {
         watermarks: { // doesn't seem to do anything
            statements: [ 99, 100 ],
            functions: [ 99, 100 ],
            branches: [ 99, 100 ],
            lines: [ 99, 100 ]
         }
      },
   });

   config.set(theConfig);
};
