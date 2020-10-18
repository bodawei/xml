/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityId,  } from 'basic';

import STokenSource from '../STokenSource';
import SToken from '../SToken';

const PLACEHOLDER_RANGE = new Range(new EntityId(), 0, 0, 0, 1, 0, 1);
const PEEK = '___PEEK___';
const ANY = '___ANY___';

type DeliverSToken = (stoken?: SToken) => void;

/**********************************************************************\
  Miscellaneous utilities for use in testing.
\**********************************************************************/

/**********************************************************************\
  makeSToken() will return a SToken using the specified text and
  RangeMaker
\**********************************************************************/

function makeSToken(text: string, rangeMaker?: RangeMaker) {
   const range = rangeMaker ? rangeMaker.makeRange(text) : PLACEHOLDER_RANGE;
   return new SToken(text, text, range);
}

type STokenMaker = (text: string) => SToken;

function makeSTokenMaker(entityId = new EntityId(), index = 0, row = 0, column = 0): STokenMaker {
   const rangeMaker = new RangeMaker(entityId, index, row, column);

   return function maker(text: string) {
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
   public entityId: EntityId;
   public index: number;
   public column: number;
   public row: number;

   constructor(entityId = new EntityId(), index = 0, row = 0, column = 0) {
      this.entityId = entityId;
      this.index = index;
      this.column = column;
      this.row = row;
   }

   makeRange(text: string) {
      const oldIndex = this.index;
      const oldRow = this.row;
      const oldColumn = this.column;

      this.index += text.length;
      this.column += text.length;

      return new Range(this.entityId, oldIndex, oldRow, oldColumn, this.index, this.row, this.column);
   }
}

/**********************************************************************\
  MockSTokenSource is passed a set of value to return, and then gathers
  calls that would be made to a STokenSource and will respond to them
  when respondInAsyncTime() is called. This allows one to simulate
  the asynchronous behavior of a STokenSource more tersely in tests.
\**********************************************************************/

type PeekValue = { type: typeof PEEK, peekedValue: string | undefined };
type SimpleMockValue = undefined | string | PeekValue;
type TupleMockValue = [SimpleMockValue, string, any] | [SimpleMockValue, string];
type MockValues = Array<SimpleMockValue | TupleMockValue>;
type PrepValue = {
   type: string,
   token: SToken | undefined,
   peekedValue?: string | undefined,
   param?: any
};
type PreparedMockValues = Array<PrepValue>;

class MockSTokenSource extends STokenSource {
   public expectedValues: PreparedMockValues;
   public queuedCalls: Array<any>;

   public static PEEK = (peekedValue: string | undefined): PeekValue => {
      return {
         type: PEEK,
         peekedValue,
      };
   };

   /*
    * We can accept
    *  - a string: It gets mapped to [ SToken(str) ]
    *  - undefined: It gets mapped to [ undefined ]
    *  - A PEEK: It gets mapped to [ SToken(next str) ]
    *  - An array with a string first element: [ SToken(str), ...]
    *  - An array with a PEEK in the first element: [ SToken(next str) ]
    */
   constructor(expectedValues: MockValues, index = 0, row = 0, column = 0) {
      super({}, new EntityId());
      const makeToken = makeSTokenMaker(undefined, index, row, column);

      this.expectedValues = expectedValues.map((entry) => {
         if (!entry) {
            return {
               type: ANY,
               token: undefined,
            };
         } else if (typeof entry === 'string') {
            return {
               type: ANY,
               token: makeToken(entry),
            };
         } else if (Array.isArray(entry)) {
            const first = entry[0];

            if (typeof first === 'string') {
               return {
                  type: entry[1],
                  token: makeToken(first),
                  param: entry[2],
               };
            } else if (!first) {
               return {
                  type: entry[1],
                  token: undefined,
                  param: entry[2],
               };
            } else {
               // this is a peek, which allows us to adjust the offsets right
               return {
                  type: entry[1],
                  token: undefined,
                  peekedValue: first.peekedValue,
                  param: entry[2],
               };
            }
         } else if (entry.type === PEEK) {
            return {
               type: PEEK,
               token: undefined,
               peekedValue: entry.peekedValue,
            };
         } else {
            throw new Error(`Passed an unknown type to the MockSTokenSource: ${typeof entry}`);
         }
      });

      // Replace PEEK's with the next value
      for (let index = this.expectedValues.length - 1; index >= 0; index--) {
         const current = this.expectedValues[index];
         const next = this.expectedValues[index + 1];
         const prev = this.expectedValues[index - 1];

         if (current.type === PEEK || 'peekedValue' in current) {
            const peekString = current.peekedValue;
            let token;

            if (peekString === undefined) {
               token = undefined;
            } else
            if (next && next.token) {
               token = new SToken(peekString, peekString, new Range(new EntityId(),
                  next.token.ranges[0].startIndex,
                  next.token.ranges[0].startRow,
                  next.token.ranges[0].startColumn,
                  next.token.ranges[0].startIndex + peekString.length,
                  next.token.ranges[0].startRow,
                  next.token.ranges[0].startColumn + peekString.length));
            } else if (prev && prev.token && prev.type !== PEEK) {
               token = new SToken(peekString, peekString, new Range(new EntityId(),
                  prev.token.ranges[0].endIndex,
                  prev.token.ranges[0].endRow,
                  prev.token.ranges[0].endColumn,
                  prev.token.ranges[0].endIndex + peekString.length,
                  prev.token.ranges[0].endRow,
                  prev.token.ranges[0].endColumn + peekString.length));
            } else {
               token = new SToken(peekString, peekString, new Range(new EntityId(),
                  0,
                  0,
                  0,
                  peekString.length,
                  0,
                  peekString.length));
            }

            this.expectedValues[index].type = ANY;
            this.expectedValues[index].token = token;
         }
      }
      this.queuedCalls = [];

      this.extractToObject = spyOn(this as any, 'extractToObject').and.callThrough(); // typeHack
      this.extract = spyOn(this as any, 'extract').and.callThrough(); // typeHack
   }

   extractToObjectNoParams(type: string, obj: Object, name: string): void {
      this.extractToObject(type, undefined, obj, name);
   }

   extractToObject(type: string, params: any, obj: Object, name: string): void {
      this.queuedCalls.push({
         type,
         params,
         obj,
         name,
      });
   }

   extractNoParams(type: string, deliverSToken: DeliverSToken): void {
      this.extract(type, undefined, deliverSToken);
   }

   extract(type: string, params: any, deliverSToken: DeliverSToken): void {
      this.queuedCalls.push({
         type,
         params,
         callback: deliverSToken,
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

   _getAdjustedValue(actualCall: any) {
      const expected = this.expectedValues.shift()!; // never undefined

      if (expected.type !== ANY && expected.type !== actualCall.type) {
         throw new Error('Type of call did not match expectation. ' +
            `Expected ${expected.type} (${expected.token?.str}, ${expected.param}) but got "${actualCall.type}".`);
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

export {
   MockSTokenSource,
   RangeMaker,
   makeSToken,
   makeSTokenMaker,
   STokenMaker,
};
