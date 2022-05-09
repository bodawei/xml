import { expect } from '@jest/globals';
import { makeErrorMatcher } from 'basic-test';

import { error, warning } from 'basic';
import { WellFormedError } from '../../error/WellFormedError';

// Force the loading of values into various error objects
import { wellFormedErrors } from '../../error/wellFormedErrors';
import { wellFormedWarnings } from '../../error/wellFormedWarnings';

error.addMapping(wellFormedErrors);
warning.addMapping(wellFormedWarnings);

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
