/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlToken = require('./XmlToken.js');

beforeEach(() => {

   jasmine.addMatchers({
      toBeSyntaxError: () => {
         return {
            compare: (actual, expected) => {
               const typePass = actual.type === XmlToken.SYNTAX_ERROR;
               const codePass = actual.code === expected;
               let message;

               if (!typePass || !codePass) {
                  message = 'Expected syntax error code ' + actual.code +
                     ' not to match ' + expected.code;
               } else {
                  message = 'Expected syntax error code ' + actual.code +
                     ' to match ' + expected.code;
               }

               return {
                  pass: typePass && codePass,
                  message: message
               };
            }
         };
      }
   });

});
