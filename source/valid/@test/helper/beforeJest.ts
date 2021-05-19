import { expect } from '@jest/globals';
import { StringBundle } from 'basic';
import { makeErrorMatcher } from 'basic-test';

import validityMessages from '../../error/derive/ValidityError.json';

import { ValidityError } from '../../error/ValidityError';
import { error, warning } from 'basic';
import { validWarnings } from '../../error/validWarnings';
import { validError } from '../../error/validError';

warning.addMapping(validWarnings);
error.addMapping(validError);

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
