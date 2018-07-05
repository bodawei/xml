/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityLocation } from '../../basic';

import SToken from '../SToken';

const PLACEHOLDER_RANGE = new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1);
const PEEK = '___PEEK___';

/**********************************************************************\
  Miscellaneous utilities for use in testing.
\**********************************************************************/

/**********************************************************************\
  makeSToken() will return a SToken using the specified text and
  RangeMaker
\**********************************************************************/

function makeSToken(text, rangeMaker) {
   const range = rangeMaker ? rangeMaker.makeRange(text) : PLACEHOLDER_RANGE;
   return new SToken(text, text, range);
}

function makeSTokenMaker(location = new EntityLocation(), index = 0, row = 0, column = 0) {
   const rangeMaker = new RangeMaker(location, index, row, column);

   return function maker(text) {
      return makeSToken(text, rangeMaker);
   };
}

/**********************************************************************\
  RangeMaker makes it easy to generate new ranges. Given a string
  it will increment counters it has to produce a Range that comes
  right after the previous one this has returned.  This makes it easy
  to generate ordinary ranges (no newline normalization) in tests.
\**********************************************************************/

class RangeMaker {

   constructor(location = new EntityLocation(), index = 0, row = 0, column = 0) {
      this.location = location;
      this.index = index;
      this.column = column;
      this.row = row;
   }

   makeRange(text) {
      const oldIndex = this.index;
      const oldRow = this.row;
      const oldColumn = this.column;

      this.index += text.length;
      this.column += text.length;

      return new Range(this.location, oldIndex, oldRow, oldColumn, this.index, this.row, this.column);
   }
}

/**********************************************************************\
  MockSTokenSource is passed a set of value to return, and then gathers
  calls that would be made to a STokenSource and will respond to them
  when respondInAsyncTime() is called. This allows one to simulate
  the asynchronous behavior of a STokenSource more tersely in tests.
\**********************************************************************/

class MockSTokenSource {

   /*
    * We can accept
    *  - a string: It gets mapped to [ SToken(str) ]
    *  - undefined: It gets mapped to [ undefined ]
    *  - A PEEK: It gets mapped to [ SToken(next str) ]
    *  - An array with a string first element: [ SToken(str), ...]
    *  - An array with a PEEK in the first element: [ SToken(next str) ]
    */
   constructor(expectedValues, index = 0, row = 0, column = 0) {
      const makeToken = makeSTokenMaker(undefined, index, row, column);

      this.expectedValues = expectedValues.map((entry) => {
         if (typeof entry === 'string') {
            return { token: makeToken(entry) };
         } else if (Array.isArray(entry)) {
            if (typeof entry[0] === 'string') {
               entry[0] = makeToken(entry[0]);
            }
            return {
               token: entry[0],
               type: entry[1],
               param: entry[2],
            };
         }

         return { token: entry };
      });

      // Replace PEEK's with the next value
      for (let index = this.expectedValues.length - 1; index >= 0; index--) {
         if (!this.expectedValues[index].token) {
            continue;
         }

         if (this.expectedValues[index].token.type === PEEK) {
            const peekString = this.expectedValues[index].token.value;
            let token;

            if (this.expectedValues[index + 1] && this.expectedValues[index + 1].token) {
               const following = this.expectedValues[index + 1];
               token = new SToken(peekString, peekString, new Range(new EntityLocation(),
                  following.token.ranges[0].startIndex,
                  following.token.ranges[0].startRow,
                  following.token.ranges[0].startColumn,
                  following.token.ranges[0].startIndex + peekString.length,
                  following.token.ranges[0].startRow,
                  following.token.ranges[0].startColumn + peekString.length));
            } else if (this.expectedValues[index - 1] &&
               this.expectedValues[index - 1].token &&
               this.expectedValues[index - 1].token.type !== PEEK) {
               const preceding = this.expectedValues[index - 1];
               token = new SToken(peekString, peekString, new Range(new EntityLocation(),
                  preceding.token.ranges[0].endIndex,
                  preceding.token.ranges[0].endRow,
                  preceding.token.ranges[0].endColumn,
                  preceding.token.ranges[0].endIndex + peekString.length,
                  preceding.token.ranges[0].endRow,
                  preceding.token.ranges[0].endColumn + peekString.length));
            } else {
               token = new SToken(peekString, peekString, new Range(new EntityLocation(),
                  0,
                  0,
                  0,
                  peekString.length,
                  0,
                  peekString.length));
            }

            this.expectedValues[index].token = token;
         }
      }
      this.queuedCalls = [];

      this.extractToObject = spyOn(this, 'extractToObject').and.callThrough();
      this.extract = spyOn(this, 'extract').and.callThrough();
   }

   extractToObjectNoParams(type, obj, name) {
      this.extractToObject(type, undefined, obj, name);
   }

   extractToObject(type, params, obj, name) {
      if (!name) {
         name = obj;
         obj = params;
         params = undefined;
      }

      this.queuedCalls.push({
         type,
         params,
         obj,
         name,
      });
   }

   extractNoParams(type, callback) {
      this.extract(type, undefined, callback);
   }

   extract(type, params, callback) {
      if (!callback) {
         callback = params;
         params = undefined;
      }

      this.queuedCalls.push({
         type,
         params,
         callback,
      });
   }

   respondInAsyncTime() {
      while (this.queuedCalls.length > 0) {
         const calls = this.queuedCalls;
         this.queuedCalls = [];

         calls.forEach((qc) => {
            if (qc.obj) {
               if (this.expectedValues.length === 0) {
                  throw new Error(`NO value provided to "${qc.name}" in MockSTokenSource.`);
               }

               qc.obj[qc.name] = this._getAdjustedValue(qc);
            } else {
               if (this.expectedValues.length === 0) {
                  throw new Error(`NO value provided for extraction type "${qc.type}" in MockSTokenSource.`);
               }

               qc.callback(this._getAdjustedValue(qc));
            }
         });
      }
   }

   _getAdjustedValue(actualCall) {
      const expected = this.expectedValues.shift();

      if (expected.type && expected.type !== actualCall.type) {
         throw new Error('Type of call did not match expectation. ' +
            `Expected "${expected.type}" but got "${actualCall.type}".`);
      }

      if (expected.param) {
         if (Array.isArray(expected.param)) {
            if (expected.param.length !== actualCall.params.length) {
               throw new Error('Parameters passed to STokenSource did not match expectation. ' +
               `Expected "['${expected.param.join('\', \'')}']" but got ` +
               `"['${actualCall.params.join('\', \'')}']".`);
            }

            for (let paramIndex = 0; paramIndex < expected.param.length; paramIndex++) {
               if (expected.param[paramIndex] !== actualCall.params[paramIndex]) {
                  throw new Error('Parameters passed to STokenSource did not match expectation. ' +
                     `Expected "${expected.param[paramIndex]}" but got "${actualCall.params[paramIndex]}".`);
               }
            }
         } else if (expected.param !== actualCall.params) {
            throw new Error('Parameters passed to STokenSource did not match expectation. ' +
               `Expected "${expected.param}" but got "${actualCall.params}".`);
         }
      }

      return expected.token;
   }
}

MockSTokenSource.PEEK = (value) => {
   return {
      type: PEEK,
      value,
   };
};

export {
   MockSTokenSource,
   RangeMaker,
   makeSToken,
   makeSTokenMaker,
};
