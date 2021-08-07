import { expect } from '@jest/globals';

import { error, warning } from 'basic';
import { makeNewErrorMatcher } from 'basic-test';

import { validWarnings } from '../../error/validWarnings';
import { validError } from '../../error/validError';
import { validityConstraint } from '../../error/validityConstraint';

warning.addMapping(validWarnings);
error.addMapping(validError);

expect.extend({
   toReportValidityError: makeNewErrorMatcher(validityConstraint),
});

// declare global {
//    namespace jasmine {
//       interface Matchers<T> {
//          toReportValidityError(errorProps: ErrorProps): void;
//       }
//    }
// }

export { validityConstraint };
