/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, global-require */

'use strict';

var jitGrunt = require('jit-grunt');
var fs = require('fs');
var os = require('os');
var path = require('path');

var coverageReport = require('./coverageReport.js');
var testReport = require('./testReport.js');
var registerCheckKeys = require('./check-keys.js');
var registerDeriveLocale = require('./deriveLocale.js');

var MODULE_NAME = 'xt4j';
var BUILD_DIR = './build/';
var SOURCE_DIR = './source/';
var SOURCE_DERIVED_DIR = './source/derive/';
var SOURCE_LOCALE_DIR = './source/locale/';
var OUT_DIR = './temp/';
var DIST_DIR = './dist/';
var NODE_MODULES_DIR = './node_modules';
var DIST_NPM_DIR = DIST_DIR + '/npm/' + MODULE_NAME + '/';
var DIST_FLAT_DIR = DIST_DIR + '/es5file/';

var JS_SOURCE_FILE_GLOB = [
   SOURCE_DIR + '**/*.js',
   '!' + SOURCE_DIR + '**/*.test.js'
];
var JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js',
   './Gruntfile.js'
];
var OTHER_FILE_GLOB = [
   SOURCE_DIR + '/meta/*'
];

var BABEL_PRESETS = 'es2015';

var controller;

module.exports = function standardBuild(grunt) {
   var browsers;

   jitGrunt(grunt);
   coverageReport(grunt);
   testReport(grunt);
   registerDeriveLocale(grunt);
   registerCheckKeys(grunt);

   // Figure out what browsers we should be able to run on the current platform.
   if (/darwin/.test(process.platform)) {
      browsers = [ 'Chrome', 'Firefox', 'Opera', 'PhantomJS', 'Safari', 'Vivaldi' ];
   } else if (/^win/.test(process.platform)) {
      browsers = [ 'Chrome', 'Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Vivaldi' ];
   } else {
      grunt.fail.fatal('Unknown or unsupported platform. Please add support for it with a pull request.');
   }

   grunt.initConfig({
      // See https://www.npmjs.com/package/grunt-jasmine-node-coverage
      /* eslint-disable camelcase */
      jasmine_node: {
         dist: {
            src: [ SOURCE_DIR + '**/*.js' ],
            options: {
               forceExit: true,
               jasmine: {
                  spec_dir: './',
                  spec_files: [
                     SOURCE_DIR + '**/*.test.js',
                     BUILD_DIR + '**/*.test.js'
                  ],
                  reporters: {
                     // See https://github.com/bcaudan/jasmine-spec-reporter
                     spec: {
                        displaySuccessesSummary: false,
                        displayFailuresSummary: true,
                        displaySuccessfulSpec: false,
                        displayFailedSpec: true,
                        displaySpecDuration: true
                     }
                  }
               },
               coverage: {
                  reportDir: OUT_DIR + 'nodeCoverage/node ' + process.version +
                     ' (' + os.type() + ' ' + os.release() + ')/',
                  excludes: [ SOURCE_DIR + '**/*.test.js' ],
                  report: [
                     'lcov',
                     'json-summary',
                     'text' // or text-summary
                  ],
                  collect: [
                     '*coverage.json'
                  ]
               }
            }
         }
      },
      eslint: {
         target: JS_FILE_GLOB,
         options: {
            configFile: BUILD_DIR + 'style/eslintrc.js',
            rulePaths: [ BUILD_DIR + 'style/customEslintRules' ],
            cache: true,
            cacheLocation: OUT_DIR + 'eslintCache.json'
         }
      },
      karma: {
         dist: {
            configFile: BUILD_DIR + 'karmaConfig.js',
            browsers: browsers
         },
         dev: {
            configFile: BUILD_DIR + 'karmaConfig.js',
            autoWatch: true,
            singleRun: false,
            browserify: {
               debug: true,
               transform: [
                  [ 'babelify', { presets: [ BABEL_PRESETS ] } ]
               ]
            },
            reporters: [ 'progress', 'junit' ],
            coverageReporter: {}
         }
      },
      copy: {
         distNpm: {
            files: [ {
               src: OTHER_FILE_GLOB,
               dest: DIST_NPM_DIR,
               expand: true,
               flatten: true
            } ]
         }
      },
      babel: {
         options: {
            sourceMap: true,
            presets: [ BABEL_PRESETS ]
         },
         distNpm: {
            files: [ {
               src: JS_SOURCE_FILE_GLOB,
               dest: DIST_NPM_DIR + '/lib/',
               expand: true,
               flatten: true
            } ]
         }
      },
      browserify: {
         distFlatfile: {
            src: JS_SOURCE_FILE_GLOB,
            dest: DIST_FLAT_DIR + '/' + MODULE_NAME + '.js',
            options: {
               browserifyOptions: {
                  debug: true, // source maps!
                  standalone: 'dxLog',
                  transform: [
                     [ 'babelify', { presets: [ BABEL_PRESETS ] } ]
                  ]
               }
            }
         }
      },
      exorcise: {
         distFlatfile: {
            options: {},
            src: DIST_FLAT_DIR + '/' + MODULE_NAME + '.js',
            dest: DIST_FLAT_DIR + '/' + MODULE_NAME + '.map'
         }
      },
      cat: {
         testReport: {
            file: OUT_DIR + '/testCoverage/text.txt'
         }
      },
      testreport:  {
         dist: {
            options: {
               reportDir: OUT_DIR + '/testResults/',
               testFileName: 'test-summary.json',
               summaryFile: path.join(OUT_DIR, './test-summary.txt')
            }
         }
      },
      coveragereport:  {
         dist: {
            options: {
               filesToSkip: [ ],
               reportDir: OUT_DIR,
               coverageFileName: 'coverage-summary.json',
               summaryFile: path.join(OUT_DIR, './coverage-summary.txt')
            }
         }
      },
      checkkeys: {
         dist: {
            src: JS_SOURCE_FILE_GLOB,
            options: {
               propFiles: [ SOURCE_LOCALE_DIR + '**/base.properties' ]
            }
         }
      },
      derivelocale: {
         default: {
            options: {
               sourceDir: SOURCE_LOCALE_DIR,
               destDir: SOURCE_DERIVED_DIR
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-jasmine-node-coverage');

   grunt.registerTask('default', [
      'quietBuild',
      'clean',
      'mkout',
      'derivelocale',
      'test',
      'jasmine_node:dist',
      'eslint',
      'checkkeys',
      'testreport',
      'coveragereport',
      '_dist',
      'dumpReports'
   ]);

   grunt.registerTask('dev', [ 'derivelocale', 'karma:dev' ]);

   grunt.registerTask('test', [ 'karma:dist', '_testreport' ]);

   grunt.registerTask('quietBuild', '@@@', () => {
      controller = require('mostly-quiet-grunt');
      controller.showDots(false);
      process.passthroughWrite = controller.passthroughWrite.bind(controller);
   });

   grunt.registerTask('mkout', 'Make the output directory', () => {
      grunt.file.mkdir(OUT_DIR);
   });

   grunt.registerTask('_testreport', 'Report on tests', () => {
      grunt.log.writeln('Style Checks passed');
      grunt.log.writeln('Full coverage details in: : file://' + process.cwd() +
         '/temp/testCoverage/report-html/index.html');
      grunt.log.writeln('Coverge summary:');
      grunt.task.run('cat:testReport');
   });

   grunt.registerTask('_dist', 'Build final distribution', () => {
      grunt.file.delete(DIST_DIR, {force: true});
      grunt.file.mkdir(DIST_DIR);
      grunt.task.run('copy:distNpm');
      grunt.task.run('babel:distNpm');
      grunt.task.run('browserify:distFlatfile');
      grunt.task.run('exorcise:distFlatfile');
   });

   grunt.registerTask('dumpReports', '', () => {
      const coverageReport = fs.readFileSync(path.join(OUT_DIR, './coverage-summary.txt'));
      const testReport = fs.readFileSync(path.join(OUT_DIR, './test-summary.txt'));

      if (controller) {
         controller.passthroughWrite('TEST\n');
         controller.passthroughWrite(testReport);
         controller.passthroughWrite('\nCOVERAGE\n');
         controller.passthroughWrite(coverageReport);
      }
   });

   grunt.registerTask('clean', 'Delete non-essential files.', () => {
      grunt.file.delete(OUT_DIR, {force: true});
      grunt.file.delete(DIST_DIR, {force: true});
      grunt.file.delete(SOURCE_DERIVED_DIR, {force: true});
   });

   grunt.registerTask('deepclean', 'Deep clean (clean, remove node_modules).', () => {
      grunt.task.run('clean');
      grunt.file.delete(NODE_MODULES_DIR);
   });

};
