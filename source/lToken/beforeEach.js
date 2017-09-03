/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

function toEqualLTokenText() {
   return {
      compare: (actualLToken, expectedText) => {
         let pass = true;
         let message = '';

         if (!actualLToken) {
            throw new Error(`LToken with text "${expectedText}" is undefined, but should not be.`);
         } else {
            const expected = toLTokenTextObj(expectedText);

            if (actualLToken.text !== expected.text) {
               pass = false;
               message = 'LToken text values do not match.\n';
               message += `\tActual:   ${actualLToken.text}\n`;
               message += `\tExpected: ${expected.text}\n`;
            } else if (actualLToken.originalText !== expected.originalText) {
               pass = false;
               message = 'LToken original text values do not match.\n';
               message += `\tActual:   ${actualLToken.originalText}\n`;
               message += `\tExpected: ${expected.originalText}\n`;
            } else {
               pass = true;
               message = 'Expected text values in lToken not to match. ' +
                  `("${actualLToken.text}" and "${actualLToken.originalText}").\n`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function toEqualLTokenTexts() {
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

         const expected = expectedTexts.map(toLTokenTextObj);

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
            message = `Expected ${expected.length} lTokens, but got ${actualArray.length}.\n`;
            message += `\tExpected: ${displayLTokenTexts(expected)}\n`;
            message += `\tActual:   ${displayLTokenTexts(actualArray)}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (pass) {
               message = `Expected one or more lToken texts to not match: ${displayLTokenTexts(expected)}.`;
            } else {
               message = `The text of lToken ${mismatchIndex} ${displayLTokenTexts([ actualArray[mismatchIndex] ])}`;
               message += ` did not match ${displayLTokenTexts([ expected[mismatchIndex] ])}.`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function displayLTokenTexts(objects) {
   return objects.map((obj) => {
      if (obj.text !== obj.originalText) {
         return `"${obj.text}"/"${obj.originalText}"`;
      } else {
         return `"${obj.text}"`;
      }
   }).join(', ');
}

function toLTokenTextObj(expectedText) {
   let expected = expectedText;

   if (typeof expectedText === 'string') {
      expected = {
         text: expectedText,
         originalText: expectedText,
      };
   }

   return expected;
}

function toEqualLTokenRange() {
   return {
      compare: (actualLToken, expectedRange) => {
         let pass = true;
         let message = '';

         if (!actualLToken) {
            throw new Error('LToken is undefined, but should not be.');
         }

         if (expectedRange.equal(actualLToken.range[0])) {
            pass = true;
            message = `Expected range not to match. ("${actualLToken.range[0].toString()}").\n`;
         } else {
            pass = false;
            message = 'LToken range does not match.\n';
            message += `\tActual:   ${actualLToken.range[0].toString()}\n`;
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
      toEqualLTokenText,
      toEqualLTokenTexts,
      toEqualLTokenRange,
   });

});

module.exports = {
   toEqualLTokenText,
   toEqualLTokenTexts,
   toEqualLTokenRange,
};
