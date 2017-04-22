/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');

function toBeSyntaxError() {
   return {
      compare: (actual, expected) => {
         const typePass = actual instanceof SyntaxError;
         const codePass = actual.id === expected;
         let message;

         if (typePass && codePass) {
            message = 'Expected syntax error code ' + actual.id +
               ' not to match ' + expected + '.';
         } else {
            message = 'Expected syntax error code ' + actual.id +
               ' to match ' + expected + '.';
         }

         return {
            pass: typePass && codePass,
            message: message
         };
      }
   };
}

function toMatchClasses() {
   return {
      compare: (actualObjects, expectedConstructors) => {
         let pass = true;
         let message = '';
         let mismatchIndex;

         const maxSearch = Math.min(actualObjects.length, expectedConstructors.length);
         for (let index = 0; index < maxSearch; index++) {
            if (actualObjects[index].constructor.name !== expectedConstructors[index].name) {
               mismatchIndex = index;
               break;
            }
         }

         if (actualObjects.length !== expectedConstructors.length) {
            pass = false;
            message = `Expected ${expectedConstructors.length} objects, but got ${actualObjects.length}.`;
            message += `\n\tActual:   ${actualObjects.map((object) => object.constructor.name).join(', ')}\n`;
            message += `\tExpected: ${expectedConstructors.map((constr) => constr.name).join(', ')}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (pass) {
               const types = expectedConstructors.map((constr) => constr.name);
               message = `Expected one or more object types to not match: ${types.join()}.`;
            } else {
               message = `The type of object ${mismatchIndex} (${actualObjects[mismatchIndex].constructor.name})`;
               message += ` did not match ${expectedConstructors[mismatchIndex].name}.`;
            }
         }

         return {
            pass,
            message
         };
      }
   };
}

function toEqualChunkText() {
   return {
      compare: (actualChunk, expectedText) => {
         let pass = true;
         let message = '';

         if (!actualChunk) {
            throw new Error(`Chunk with text "${expectedText}" is undefined, but should not be.`);
         } else {
            const expected = {
               text: expectedText,
               originalText: expectedText
            };

            if (typeof expectedText === 'object') {
               expected.text = expectedText.text;
               expected.originalText = expectedText.originalText;
            }

            if (actualChunk.text !== expected.text) {
               pass = false;
               message = 'Chunk text values do not match.\n';
               message += `\tActual:   ${actualChunk.text}\n`;
               message += `\tExpected: ${expected.text}\n`;
            } else if (actualChunk.originalText !== expected.originalText) {
               pass = false;
               message = 'Chunk original text values do not match.\n';
               message += `\tActual:   ${actualChunk.originalText}\n`;
               message += `\tExpected: ${expected.originalText}\n`;
            } else {
               pass = true;
               message = 'Expected text values in chunk not to match. ' +
                  `("${actualChunk.text}" and "${actualChunk.originalText}").\n`;
            }
         }

         return {
            pass,
            message
         };
      }
   };
}

//function toEqualChunkTexts() {
//   return {
//      compare: (actualArray, expectedTexts) => {
//         let pass = true;
//         let message = '';
//         let mismatchIndex;
//
//         if (!actualArray || Array.isArray(actualArray)) {
//            throw new Error('Expected array of chunks, but got undefined or a non-array.');
//         }
//
//         const maxSearch = Math.min(actualArray.length, expectedTexts.length);
//         for (let index = 0; index < maxSearch; index++) {
//            if (actualArray[index].text !== expectedTexts[index]) {
//               mismatchIndex = index;
//               break;
//            }
//         }
//
//         if (actualArray.length !== expectedTexts.length) {
//            pass = false;
//            message = `Expected ${expectedTexts.length} chunks, but got ${actualArray.length}.\n`;
//            message += `\tActual: ${actualArray.join(', ')}\n`;
//            message += `\tExpected: ${expectedTexts.map((item) => item.text).join(', ')}\n`;
//         } else {
//            pass = mismatchIndex === undefined;
//
//            if (pass) {
//               message = `Expected one or more object types to not match: ${expectedTexts.join()}.`;
//            } else {
//               message = `The text of chunk ${mismatchIndex} (${actualArray[mismatchIndex].text})`;
//               message += ` did not match ${expectedTexts[mismatchIndex]}.`;
//            }
//         }
//
//         return {
//            pass,
//            message
//         };
//      }
//   };
//}

beforeEach(() => {

   jasmine.addMatchers({
      toBeSyntaxError,
      toMatchClasses,
      toEqualChunkText
   });

});

module.exports = {
   toBeSyntaxError,
   toMatchClasses,
   toEqualChunkText
};
