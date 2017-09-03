/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';

import LToken from './LToken.js';

const PLACEHOLDER_RANGE = new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1);
const PEEK = '___PEEK___';

/**********************************************************************\
  Miscellaneous utilities for use in testing.
\**********************************************************************/

/**********************************************************************\
  makeLToken() will return a LToken using the specified text and
  RangeMaker
\**********************************************************************/

function makeLToken(text, rangeMaker) {
   const range = rangeMaker ? rangeMaker.makeRange(text) : PLACEHOLDER_RANGE;
   return new LToken(text, text, range);
}

function makeLTokenMaker(location = new EntityLocation(), index = 0, row = 0, column = 0) {
   const rangeMaker = new RangeMaker(location, index, row, column);

   return function maker(text) {
      return makeLToken(text, rangeMaker);
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
  MockLTokenSource is passed a set of value to return, and then gathers
  calls that would be made to a LTokenSource and will respond to them
  when respondInAsyncTime() is called. This allows one to simulate
  the asynchronous behavior of a LTokenSource more tersely in tests.
\**********************************************************************/

class MockLTokenSource {

   constructor(returnValues) {
      const makeToken = makeLTokenMaker();
      this.returnValues = returnValues.map((entry) => {
         if (typeof entry === 'string') {
            return makeToken(entry);
         }
         return entry;
      });
      this.queuedCalls = [];

      this.extractToObject = spyOn(this, 'extractToObject').and.callThrough();
      this.extract = spyOn(this, 'extract').and.callThrough();
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

   extract(type, params, callback) {
      if (!callback) {
         callback = params;
         params = undefined;
      }

      this.queuedCalls.push({
         type,
         callback,
      });
   }

   respondInAsyncTime() {
      while (this.queuedCalls.length > 0) {
         const calls = this.queuedCalls;
         this.queuedCalls = [];

         calls.forEach((qc) => {
            if (qc.obj) {
               if (this.returnValues.length === 0) {
                  throw new Error(`NO value provided to "${qc.name}" in MockLTokenSource.`);
               }

               qc.obj[qc.name] = this._getAdjustedValue();
            } else {
               if (this.returnValues.length === 0) {
                  throw new Error(`NO value provided for extraction type "${qc.type}" in MockLTokenSource.`);
               }

               qc.callback(this._getAdjustedValue());
            }
         });
      }
   }

   _getAdjustedValue() {
      let value = this.returnValues.shift();

      if (value === MockLTokenSource.PEEK) {
         value = this.returnValues[0]; // return the next
      } else if (value && value.type === PEEK) {
         const next = this.returnValues[0];
         value = new LToken(value.value, value.value, new Range(new EntityLocation(),
            next.range[0].startIndex,
            next.range[0].startRow,
            next.range[0].startColumn,
            next.range[0].startIndex + value.value.length,
            next.range[0].startRow,
            next.range[0].startColumn + value.value.length
         ));
      }

      return value;
   }
}

MockLTokenSource.PEEK = (value) => {
   return {
      type: PEEK,
      value,
   };
};

module.exports = {
   MockLTokenSource,
   RangeMaker,
   makeLToken,
   makeLTokenMaker,
};
