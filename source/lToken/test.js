/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';

import LToken from './LToken.js';

const PLACEHOLDER_RANGE = new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1);

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

/**********************************************************************\
  RangeMaker makes it easy to generate new ranges. Given a string
  it will increment counters it has to produce a Range that comes
  right after the previous one this has returned.  This makes it easy
  to generate ordinary ranges (no newline normalization) in tests.
\**********************************************************************/

class RangeMaker {

   constructor(location) {
      this.location = location;
      this.index = 0;
      this.column = 0;
      this.row = 0;
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
      this.returnValues = returnValues;
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
               qc.obj[qc.name] = this.returnValues.shift();
            } else {
               if (this.returnValues.length === 0) {
                  throw new Error(`NO value provided for extraction type "${qc.type}" in MockLTokenSource.`);
               }
               qc.callback(this.returnValues.shift());
            }
         });
      }
   }
}

module.exports = {
   MockLTokenSource,
   RangeMaker,
   makeLToken,
};
