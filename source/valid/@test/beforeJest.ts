import { expect } from '@jest/globals';
import { StringBundle } from 'basic';
import { makeErrorMatcher } from 'error-test';

import validityMessages from '../../error/derive/ValidityError.json';

import { ValidityError } from '../../error/ValidityError';

expect.extend({
   toReportValidityError: makeErrorMatcher(ValidityError, {
      ValidityError: new StringBundle(validityMessages.message),
   }),
});

// declare global {
//    namespace jasmine {
//       interface Matchers<T> {
//          toReportValidityError(errorProps: ErrorProps): void;
//       }
//    }
// }

export { ValidityError };
