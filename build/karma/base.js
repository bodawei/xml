/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

var BASE_PATH = process.cwd();
var BUILD_DIR = BASE_PATH + '/build/';
var SOURCE_DIR = BASE_PATH + '/source/';

// Need to configure this 'externally' for the dynamic key. note: Order matters
const prepro = {};
prepro[SOURCE_DIR + '**/*.js'] = [ 'karma-typescript' ];
prepro[BUILD_DIR + '*.js'] = [ 'karma-typescript' ];
prepro[SOURCE_DIR + '**/*.ts'] = [ 'karma-typescript' ];
prepro[BUILD_DIR + '*.ts'] = [ 'karma-typescript' ];

// http://karma-runner.github.io/1.0/config/configuration-file.html

const config = {
   basePath: './',
   reportSlowerThan: 200,
   browsers: [ 'Chrome' ],
   captureTimeout: 20000,     // If browser does not capture in given timeout [ms], kill it
   autoWatch: false,
   singleRun: true,
   files: [
      BUILD_DIR + '**/*.jasmine*.js',
      BUILD_DIR + '**/*.test.js',
      SOURCE_DIR + '**/*.js',
      SOURCE_DIR + '**/*.ts',
      //{pattern: SOURCE_DIR + '**/*.js.map', included: false},
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
   },
};

module.exports = config;
