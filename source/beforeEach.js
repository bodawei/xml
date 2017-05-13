/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

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
            if (actualObjects[index].constructor !== expectedConstructors[index]) {
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
            const expected = toChunkTextObj(expectedText);

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

function toEqualChunkTexts() {
   return {
      compare: (actualArray, expectedTexts) => {
         let pass = true;
         let message = '';
         let mismatchIndex;

         if (!actualArray || !Array.isArray(actualArray)) {
            throw new Error('Expected array of strings or text/original texts, but got undefined or a non-array.');
         }

         // Frequently, we're going to want to just pass back the result of spy.calls.allArgs(), so just strip
         // off the inner array
         if (Array.isArray(actualArray[0])) {
            actualArray = actualArray.map((item) => { return item[0]; });
         }

         const expected = expectedTexts.map(toChunkTextObj);

         const maxSearch = Math.min(actualArray.length, expected.length);
         for (let index = 0; index < maxSearch; index++) {
            if (actualArray[index].text !== expected[index].text ||
               actualArray[index].originalText !== expected[index].originalText) {
               mismatchIndex = index;
               break;
            }
         }

         if (actualArray.length !== expected.length) {
            pass = false;
            message = `Expected ${expected.length} chunks, but got ${actualArray.length}.\n`;
            message += `\tExpected: ${displayChunkTexts(expected)}\n`;
            message += `\tActual:   ${displayChunkTexts(actualArray)}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (pass) {
               message = `Expected one or more chunk texts to not match: ${displayChunkTexts(expected)}.`;
            } else {
               message = `The text of chunk ${mismatchIndex} ${displayChunkTexts([ actualArray[mismatchIndex] ])}`;
               message += ` did not match ${displayChunkTexts([ expected[mismatchIndex] ])}.`;
            }
         }

         return {
            pass,
            message
         };
      }
   };
}
function displayChunkTexts(objects) {
   return objects.map((obj) => {
      if (obj.text !== obj.originalText) {
         return `"${obj.text}"/"${obj.originalText}"`;
      } else {
         return `"${obj.text}"`;
      }
   }).join(', ');
}

function toChunkTextObj(expectedText) {
   let expected = expectedText;

   if (typeof expectedText === 'string') {
      expected = {
         text: expectedText,
         originalText: expectedText
      };
   }

   return expected;
}

function toEqualChunkRange() {
   return {
      compare: (actualChunk, expectedRange) => {
         let pass = true;
         let message = '';

         if (!actualChunk) {
            throw new Error('Chunk is undefined, but should not be.');
         }

         if (expectedRange.equal(actualChunk.range[0])) {
            pass = true;
            message = `Expected range not to match. ("${actualChunk.range[0].toString()}").\n`;
         } else {
            pass = false;
            message = 'Chunk range does not match.\n';
            message += `\tActual:   ${actualChunk.range[0].toString()}\n`;
            message += `\tExpected: ${expectedRange.toString()}\n`;
         }

         return {
            pass,
            message
         };
      }
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toBeSyntaxError,
      toMatchClasses,
      toEqualChunkText,
      toEqualChunkTexts,
      toEqualChunkRange
   });

});

module.exports = {
   toBeSyntaxError,
   toMatchClasses,
   toEqualChunkText,
   toEqualChunkTexts,
   toEqualChunkRange
};
