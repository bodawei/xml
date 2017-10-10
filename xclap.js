const xclap = require("xclap");

var BUILD_DIR = './build/';
var SOURCE_DIR = './source/';
var SOURCE_DERIVED_DIR = './source/derive/';
var SOURCE_LOCALE_DIR = './source/locale/';
var OUT_DIR = './temp/';
var DIST_DIR = './dist/';

const JS_FILE_GLOB = [
   BUILD_DIR + '**/*.js',
   SOURCE_DIR + '**/*.js'
];



const tasks = {
   karma: 'karma start --config ./build/karmaConfig.js',
   eslint: `eslint
      --config    ${BUILD_DIR}/style/eslintrc.js
      --rulesdir  ${BUILD_DIR}/style/customEslintRules
      ${JS_FILE_GLOB.join(' ')}
   `.replace(/\n/g, ' '),
   clean: `
      rm -rf ${OUT_DIR};
      rm -rf ${DIST_DIR};
      rm -rf ${SOURCE_DERIVED_DIR};
      `.replace(/\n/g, ' '),
};
xclap.load(tasks);
