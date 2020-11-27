/* Copyright ® 2017-202 by 柏大衛. All rights reserved. */

import {expect} from '@jest/globals'
import { StringBundle } from 'basic';
import { MockErrorCollector } from 'error-test';

import { Position } from '../BaseError';
import { WellFormedError } from '../WellFormedError';
import { XmlWarning } from '../XmlWarning';

// @ts-ignore
import warningMessages from '../derive/XmlWarning.json';
// @ts-ignore
import validityMessages from '../derive/ValidityError.json';
// @ts-ignore
import wellFormedMessages from '../derive/WellFormedError.json';

interface ErrorInfo {
   position: Position,
   id: string,
   params?: Array<string>,
   lastPosition?: Position
};


const messages: { [errorTypeName: string]: StringBundle } = {
   ValidityError: new StringBundle(validityMessages.message),
   XmlWarning: new StringBundle(warningMessages.message),
   WellFormedError: new StringBundle(wellFormedMessages.message),
};

function toNotReportError(mockErrorCollector: MockErrorCollector, expectedId: string) {
   if (!mockErrorCollector) {
      throw new Error('Did not get a mock error collector as expected.');
   }

   const errors = mockErrorCollector.errors;
   let pass = true;
   let message = `No error with the id ${expectedId} reported.`;

   for (let index = 0; index < errors.length; index++) {
      const actual = errors[index];

      if (expectedId === actual.id) {
            pass = false;
            message = `The error ${expectedId} was found.`;
      }
   }

   return {
      pass,
      message: () => message,
   };
}


function makeMatcher(ErrorClass: any) {
   return function (mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo) {
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

            // @ts-ignore
            if (!this.equals(expectedError.params, actual.params)) {
               message = `Parameters for ${expectedError.id} do not match:\n` +
                  `  Actual:   ${actual.params}\n  Expected: ${expectedError.params}`;
            // @ts-ignore
            } else if (!this.equals(expectedError.position, actual.position)) {
               message = `Positions for ${expectedError.id} do not match:\n` +
                  `  Actual:   ${JSON.stringify(actual.position)}\n` +
                  `  Expected: ${JSON.stringify(expectedError.position)}`;
            } else if ((expectedError.lastPosition || !expectedError.position) &&
               // @ts-ignore
               !this.equals(expectedError.lastPosition, actual.lastPosition)) {
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
         message: () => message,
      };
   };
}

expect.extend({
   toNotReportError,
   toReportWarning: makeMatcher(XmlWarning),
   toReportError: makeMatcher(WellFormedError),
});
