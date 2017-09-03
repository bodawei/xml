/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

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
            message,
         };
      },
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
            message,
         };
      },
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
         originalText: expectedText,
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
            message,
         };
      },
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toEqualChunkText,
      toEqualChunkTexts,
      toEqualChunkRange,
   });

});

module.exports = {
   toEqualChunkText,
   toEqualChunkTexts,
   toEqualChunkRange,
};
