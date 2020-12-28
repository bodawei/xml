/* Copyright ® 2017-202 by 柏大衛. All rights reserved. */

import {expect} from '@jest/globals'
import { StringBundle } from 'basic';
import { MockErrorCollector } from 'error-test';

import { WellFormedError } from '../WellFormedError';
import { XmlWarning } from '../XmlWarning';
import { makeErrorMatcher } from './makeErrorMatcher';

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


expect.extend({
   toNotReportError,
   toReportWarning: makeErrorMatcher(XmlWarning, messages),
   toReportError: makeErrorMatcher(WellFormedError, messages),
});

