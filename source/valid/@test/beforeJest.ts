import { StringBundle } from 'basic';
import { makeErrorMatcher } from 'error-test';

import validityMessages from '../../error/derive/ValidityError.json';

import { ValidityError } from '../../error/ValidityError';

// @ts-expect-error jasmine expect does not have extend
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
expect.extend({
   toReportValidityError: makeErrorMatcher(ValidityError, {
      ValidityError: new StringBundle(validityMessages.message),
   }),
});

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toReportValidityError(errorProps: ErrorProps): void;
      }
   }
}

export { ValidityError };
