/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread, global-require */

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
var SOURCE_DERIVED_DIR = './source/error/derive/';
var SOURCE_LOCALE_DIR = './source/error/locale/';
var OUT_DIR = './temp/';
var DIST_DIR = './dist/';
var NODE_MODULES_DIR = './node_modules';
var DIST_NPM_DIR = DIST_DIR + '/npm/' + MODULE_NAME + '/';
var DIST_FLAT_DIR = DIST_DIR + '/es5file/';
var OUT_NODE_DIR = OUT_DIR + 'node_testing/';

var JS_SOURCE_FILE_GLOB = [
   SOURCE_DIR + '**/*.js',
   '!' + SOURCE_DIR + '**/*.test.js',
];
var JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js',
   './Gruntfile.js',
];
var OTHER_FILE_GLOB = [
   SOURCE_DIR + '/meta/*',
];

var JSON_FILES_GLOB = [
   SOURCE_DIR + '**/*.json',
];

// var xBABEL_PRESETS = [ ['env', {
//    targets: {
//       chrome: 58
//    }
// } ] ];

var BABEL_PRESETS = [ 'es2015', 'es2016', 'es2017' ];

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
      browsers = [ 'Brave', 'Chrome', 'Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Vivaldi' ];
   } else {
      grunt.fail.fatal('Unknown or unsupported platform. Please add support for it with a pull request.');
   }

   grunt.initConfig({
      // DONE
      eslint: {
         target: JS_FILE_GLOB,
         options: {
            configFile: BUILD_DIR + 'style/eslintrc.js',
            rulePaths: [ BUILD_DIR + 'style/customEslintRules' ],
            cache: true,
            cacheLocation: OUT_DIR + 'eslintCache.json',
         },
      },
      karma: {
         dist: {
            configFile: BUILD_DIR + 'karmaConfig.js',
            browsers: browsers,
         },
         dev: {
            configFile: BUILD_DIR + 'karmaConfig.js',
            autoWatch: true,
            singleRun: false,
            browserify: {
               debug: true,
               transform: [
                  [ 'babelify', { presets: BABEL_PRESETS } ],
               ],
            },
            reporters: [ 'progress', 'junit' ],
            coverageReporter: {},
         },
      },
      copy: {
         testNode: {
            files: [ {
               src: JSON_FILES_GLOB,
               dest: OUT_NODE_DIR,
            } ],
         },
         distNpm: {
            files: [ {
               src: OTHER_FILE_GLOB,
               dest: DIST_NPM_DIR,
               expand: true,
               flatten: true,
            } ],
         },
      },
      babel: {
         options: {
            sourceMap: true,
            presets: BABEL_PRESETS,
         },
         distNpm: {
            files: [ {
               src: JS_SOURCE_FILE_GLOB,
               dest: DIST_NPM_DIR + '/lib/',
               expand: true,
            } ],
         },
         testNode: {
            files: [ {
               src: JS_FILE_GLOB,
               dest: OUT_NODE_DIR,
               expand: true,
            } ],
         },
      },
      browserify: {
         distFlatfile: {
            src: JS_SOURCE_FILE_GLOB,
            dest: DIST_FLAT_DIR + '/' + MODULE_NAME + '.js',
            options: {
               browserifyOptions: {
                  debug: true, // source maps!
                  transform: [
                     [ 'babelify', { presets: BABEL_PRESETS } ],
                  ],
               },
            },
         },
      },
      exorcise: {
         distFlatfile: {
            options: {},
            src: DIST_FLAT_DIR + '/' + MODULE_NAME + '.js',
            dest: DIST_FLAT_DIR + '/' + MODULE_NAME + '.map',
         },
      },
      cat: {
         testReport: {
            file: OUT_DIR + '/testCoverage/text.txt',
         },
      },
      testreport:  {
         dist: {
            options: {
               reportDir: OUT_DIR + '/testResults/',
               testFileName: 'test-summary.json',
               summaryFile: path.join(OUT_DIR, './test-summary.txt'),
            },
         },
      },
      // DONE
      coveragereport:  {
         dist: {
            options: {
               filesToSkip: [ ],
               reportDir: OUT_DIR,
               coverageFileName: 'coverage-summary.json',
               summaryFile: path.join(OUT_DIR, './coverage-summary.txt'),
            },
         },
      },
      checkkeys: {
         dist: {
            src: JS_SOURCE_FILE_GLOB,
            options: {
               propFiles: [ SOURCE_LOCALE_DIR + '**/base.properties' ],
            },
         },
      },
      // DONE
      derivelocale: {
         default: {
            options: {
               sourceDir: SOURCE_LOCALE_DIR,
               destDir: SOURCE_DERIVED_DIR,
            },
         },
      },
   });

   grunt.loadNpmTasks('grunt-jasmine-node-coverage');

   grunt.registerTask('nodeCoverage', 'node coverage', function nodeCoverage() {
      const done = this.async();
      const { exec } = require('child_process');

      const reportDir = OUT_DIR + 'nodeCoverage/node ' + process.version +
         ' (' + os.type() + ' ' + os.release() + ')/';
      const reporters = [ 'lcov', 'text-summary', 'json-summary' ]
         .map((reporter) => `--reporter="${reporter}"`);

      const command = `nyc --require="babel-register" --report-dir="${reportDir}" ${reporters.join(' ')} jasmine`;

      exec(command, {}, (error, stdout) => {
         grunt.log.writeln(stdout);
         done();
      });
   });

   grunt.registerTask('default', [
      'quietBuild', // DONE-- ish
      'clean', // DONE
      'mkout', // DONE
      'derivelocale', // DONE

      'test',
      'babel:testNode',
      'copy:testNode',
      'nodeCoverage',
      'eslint', // DONE
//      'checkkeys',
      'testreport',
      'coveragereport', // DONE
      '_dist',
      'dumpReports', // DONE
   ]);

   // DONE
   grunt.registerTask('dev', [ 'derivelocale', 'karma:dev' ]);

   grunt.registerTask('test', [ 'karma:dist', '_testreport' ]);

   // DONE
   grunt.registerTask('quietBuild', '@@@', () => {
      controller = require('mostly-quiet-grunt');
      controller.showDots(false);
      process.passthroughWrite = controller.passthroughWrite.bind(controller);
   });

   // DONE
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

   // DONE
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

   // DONE
   grunt.registerTask('clean', 'Delete non-essential files.', () => {
      grunt.file.delete(OUT_DIR, {force: true});
      grunt.file.delete(DIST_DIR, {force: true});
      grunt.file.delete(SOURCE_DERIVED_DIR, {force: true});
   });

   // DONE
   grunt.registerTask('deepclean', 'Deep clean (clean, remove node_modules).', () => {
      grunt.task.run('clean');
      grunt.file.delete(NODE_MODULES_DIR);
   });

};
