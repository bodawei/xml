/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import WellFormedError from '../WellFormedError';
import XmlWarning from '../XmlWarning';

/**********************************************************************\
  Miscellaneous utilities for use in testing things in this namespace
\**********************************************************************/

class MockErrorCollector {
   constructor() {
      this.errors = [];
      this.setPos = this.setPos.bind(this);
      this.report = this.report.bind(this);

      this.setPos = jasmine.createSpy('setPosSpy').and.callFake(this.setPos);
      this.getErrors = jasmine.createSpy('getErrorsSpy');
      this.report = jasmine.createSpy('reportSpy').and.callFake(this.report);
   }

   setPos(sToken) {
      if (sToken) {
         this._lastNotNull = sToken;
      }

      this._lastPos = sToken;
   }

   report(id, params, position) {
      const info = {
         position: position || this._lastPos,
         id,
         params,
      };
      if (!this._lastPos) {
         info.lastPosition = this._lastNotNull;
      }

      this.errors.push(info);
   }

   check(condition, id, params) {
      if (condition) {
         if (params) {
            this.report(id, params);
         } else {
            this.report(id);
         }
      }
   }

   reportError(id, context, params) {
      this.report(id, params);
   }
}

function toReportError(util) {
   return makeCompareObject(util, WellFormedError);
}

function toReportWarning(util) {
   return makeCompareObject(util, XmlWarning);
}

function makeCompareObject(util, ErrorClass) {
   return {
      compare: (mockErrorCollector, expectedError) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual = errors[index];

            if (expectedError.id === actual.id) {
               const errMsg = ErrorClass.STRING.lookup(actual.id || '');

               if (!errMsg) {
                  pass = false;
                  message = `The error ${expectedError.id} is not a legal error ID.`;
                  break;
               } else {
                  let count = 0;
                  let offset = errMsg.indexOf('{');

                  while (offset !== -1) {
                     count++;
                     offset = errMsg.indexOf('{', offset + 1);
                  }

                  const params = actual.params || [];
                  if (count !== params.length) {
                     pass = false;
                     message = `${expectedError.id} expects ${count} parameters, but ${params.length} found.`;
                     break;
                  }
               }

               if (!util.equals(expectedError.params, actual.params)) {
                  message = `Parameters for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${actual.params}\n  Expected: ${expectedError.params}`;
               } else if (!util.equals(expectedError.position, actual.position)) {
                  message = `Positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.position)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.position)}`;
               } else if ((expectedError.lastPosition || !expectedError.position) &&
                  !util.equals(expectedError.lastPosition, actual.lastPosition)) {
                  message = `Last positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.lastPosition)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.lastPosition)}`;
               } else {
                  pass = true;
                  message = `Error matching ${expectedError.id} was found, but should not have been.`;
               }
            }
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
      toReportError,
      toReportWarning,
   });

});

export {
   MockErrorCollector,
   toReportError,
   toReportWarning,
};
