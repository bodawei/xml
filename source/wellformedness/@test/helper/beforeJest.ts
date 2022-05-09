import { expect } from '@jest/globals';
import { makeErrorMatcher } from 'basic-test';

import { error } from 'basic';
import { WellFormedError } from '../../error/WellFormedError';

// Force the loading of values into various error objects
import { wellFormedErrors } from '../../error/wellFormedErrors';

error.addMapping(wellFormedErrors);

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
