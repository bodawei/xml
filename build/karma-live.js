/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var, prefer-spread */

const base = require('./karma/base.js');

var BABEL_PRESETS = [ 'es2015', 'es2016', 'es2017' ];

module.exports = function karmaConfig(config) {
   const theConfig = Object.assign({}, base, {
      logLevel: config.LOG_ERROR, // also: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      autoWatch: true,
      singleRun: false,
      browserify: {
         debug: true,
         transform: [
            [ 'babelify', { presets: BABEL_PRESETS } ],
         ],
      },
      reporters: [ 'progress' ],
   });

   config.set(theConfig);
};
