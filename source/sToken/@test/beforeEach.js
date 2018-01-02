/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

function toEqualSTokenText() {
   return {
      compare: (actualSToken, expectedText) => {
         let pass = true;
         let message = '';

         if (!actualSToken) {
            throw new Error(`SToken with text "${expectedText}" is undefined, but should not be.`);
         } else {
            const expected = toSTokenTextObj(expectedText);

            if (actualSToken.text !== expected.text) {
               pass = false;
               message = 'SToken text values do not match.\n';
               message += `\tActual:   ${actualSToken.text}\n`;
               message += `\tExpected: ${expected.text}\n`;
            } else if (actualSToken.originalText !== expected.originalText) {
               pass = false;
               message = 'SToken original text values do not match.\n';
               message += `\tActual:   ${actualSToken.originalText}\n`;
               message += `\tExpected: ${expected.originalText}\n`;
            } else {
               pass = true;
               message = 'Expected text values in SToken not to match. ' +
                  `("${actualSToken.text}" and "${actualSToken.originalText}").\n`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function toEqualSTokenTexts() {
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

         const expected = expectedTexts.map(toSTokenTextObj);

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
            message = `Expected ${expected.length} STokens, but got ${actualArray.length}.\n`;
            message += `\tExpected: ${displaySTokenTexts(expected)}\n`;
            message += `\tActual:   ${displaySTokenTexts(actualArray)}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (pass) {
               message = `Expected one or more SToken texts to not match: ${displaySTokenTexts(expected)}.`;
            } else {
               message = `The text of SToken ${mismatchIndex} ${displaySTokenTexts([ actualArray[mismatchIndex] ])}`;
               message += ` did not match ${displaySTokenTexts([ expected[mismatchIndex] ])}.`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function displaySTokenTexts(objects) {
   return objects.map((obj) => {
      if (obj.text !== obj.originalText) {
         return `"${obj.text}"/"${obj.originalText}"`;
      } else {
         return `"${obj.text}"`;
      }
   }).join(', ');
}

function toSTokenTextObj(expectedText) {
   let expected = expectedText;

   if (typeof expectedText === 'string') {
      expected = {
         text: expectedText,
         originalText: expectedText,
      };
   }

   return expected;
}

function toEqualSTokenRange() {
   return {
      compare: (actualSToken, expectedRange) => {
         let pass = true;
         let message = '';

         if (!actualSToken) {
            throw new Error('SToken is undefined, but should not be.');
         }

         if (expectedRange.equals(actualSToken.ranges[0])) {
            pass = true;
            message = `Expected range not to match. ("${actualSToken.ranges[0].toString()}").\n`;
         } else {
            pass = false;
            message = 'SToken range does not match.\n';
            message += `\tActual:   ${actualSToken.ranges[0].toString()}\n`;
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
      toEqualSTokenText,
      toEqualSTokenTexts,
      toEqualSTokenRange,
   });

});

module.exports = {
   toEqualSTokenText,
   toEqualSTokenTexts,
   toEqualSTokenRange,
};
