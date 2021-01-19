import { expect } from '@jest/globals';
import { makeErrorMatcher } from 'basic-test';

import { WellFormedError } from '../../error/WellFormedError';

expect.extend({
   toReportWFError: makeErrorMatcher(WellFormedError),
});

// declare global {
//    namespace jasmine {
//       interface Matchers<T> {
//          toReportWFError(errorProps: ErrorProps): void;
//       }
//    }
// }

export { WellFormedError };
