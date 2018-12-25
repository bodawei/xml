/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { StringBundle } from 'basic';
import { SToken } from 'sToken';

import { Position } from '../BaseError';
import { WellFormedError } from '../WellFormedError';
import { XmlWarning } from '../XmlWarning';
import ErrorCollector  from '../ErrorCollector';

// @ts-ignore
import warningMessages from '../derive/XmlWarning.json';
// @ts-ignore
import validityMessages from '../derive/ValidityError.json';
// @ts-ignore
import wellFormedMessages from '../derive/WellFormedError.json';

const messages: { [errorTypeName: string]: StringBundle } = {
   ValidityError: new StringBundle(validityMessages.message),
   XmlWarning: new StringBundle(warningMessages.message),
   WellFormedError: new StringBundle(wellFormedMessages.message),
};

/**********************************************************************\
  Miscellaneous utilities for use in testing things in this namespace
\**********************************************************************/

type ErrorInfo = {
   position: Position,
   id: string,
   params?: Array<string>,
   lastPosition?: Position
};

declare class ErrorToken {
   public readonly id: string;
   constructor(id: string, params: Array<string>, position: Position, context: Position);
};

type ErrConstFunc = typeof ErrorToken;

/*
 * The chief reason for this mock collector is simply that it stores the individual
 * properties passed to the error functions, rather than them building a string
 * immediately with them. This lets us do more checking without needing to test
 * the strings generated, and helps us validate that we're passing the right
 * numbers of parameters etc.
 */
class MockErrorCollector extends ErrorCollector {
   public _lastNotNull?: SToken;
   public _lastPos?: SToken;
   public _lastPosition?: SToken;
   public errors: Array<ErrorInfo> = [];

   constructor() {
      super(SToken.fromString('test'), WellFormedError);
      this.errors = [];
      this.setPos = this.setPos.bind(this);
      this.report = this.report.bind(this);

      this.setPos = jasmine.createSpy('setPosSpy').and.callFake(this.setPos);
      this.getErrors = jasmine.createSpy('getErrorsSpy');
      this.report = jasmine.createSpy('reportSpy').and.callFake(this.report);
   }

   setPos(sToken?: SToken) {
      if (sToken) {
         this._lastNotNull = sToken;
      }

      this._lastPos = sToken;
   }

   report(id: string, params?: Array<string>, position?: Position) {
      const info: ErrorInfo = {
         position: position || this._lastPos,
         id,
         params,
      };
      if (!this._lastPos) {
         info.lastPosition = this._lastNotNull;
      }

      this.errors.push(info);
   }

   check(condition: any, id: string, params?: Array<string>, position?: Position) {
      if (condition) {
         if (params) {
            this.report(id, params);
         } else {
            this.report(id);
         }
      }
   }

   reportError(id: string, constructor: ErrConstFunc, params: Array<string>, position?: Position) {
      this.report(id, params);
   }
}

function toReportError(util: any) {
   return makeCompareObject(util, WellFormedError);
}

function toReportWarning(util: any) {
   return makeCompareObject(util, XmlWarning);
}

function makeCompareObject(util: any, ErrorClass: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected.');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual = errors[index];

            if (expectedError.id === actual.id) {
               const errMsg = messages[ErrorClass.name].lookup(actual.id || '', 'base');

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
