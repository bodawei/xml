/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

'use strict';

var jitGrunt = require('jit-grunt');

var MODULE_NAME = 'xt4j';
var BUILD_DIR = './build/';
var SOURCE_DIR = './source/';
var OUT_DIR = './temp/';
var DIST_DIR = './dist/';
var NODE_MODULES_DIR = './node_modules';
var DIST_NPM_DIR = DIST_DIR + '/npm/' + MODULE_NAME + '/';
var DIST_FLAT_DIR = DIST_DIR + '/es5file/';

var JS_SOURCE_FILE_GLOB = [
   SOURCE_DIR + '/*.js',
   '!' + SOURCE_DIR + '/*.test.js'
];
var JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js',
   './Gruntfile.js'
];
var OTHER_FILE_GLOB = [
   SOURCE_DIR + '/*',
   '!' + SOURCE_DIR + '/*.js'
];

var BABEL_PRESETS = 'es2015';

module.exports = function standardBuild(grunt) {
   var browsers;

   jitGrunt(grunt);

   // Figure out what browsers we should be able to run on the current platform.
   if (/darwin/.test(process.platform)) {
      browsers = [ 'PhantomJS', 'Chrome', 'Firefox', 'Safari' ];
   } else if (/^win/.test(process.platform)) {
      browsers = [ 'Chrome', 'Firefox', 'Internet Explorer', 'PhantomJS2' ];
   } else {
      grunt.fail.fatal('Unknown or unsupported platform. Please add support for it with a pull request.');
   }

   grunt.initConfig({
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
      }
   });

   grunt.registerTask('default', [
      'eslint',
      'test',
      '_dist'
   ]);

   grunt.registerTask('dev', [ 'karma:dev' ]);

   grunt.registerTask('test', [ 'karma:dist', '_testreport' ]);

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

   grunt.registerTask('clean', 'Delete non-essential files.', () => {
      grunt.file.delete(OUT_DIR, {force: true});
      grunt.file.delete(DIST_DIR, {force: true});
   });

   grunt.registerTask('deepclean', 'Deep clean (clean, remove node_modules).', () => {
      grunt.task.run('clean');
      grunt.file.delete(NODE_MODULES_DIR);
   });

};
