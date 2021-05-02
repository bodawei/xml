import { expect } from '@jest/globals';
import { makeErrorMatcher } from 'basic-test';

import { fatalError, warning } from 'basic';
import { WellFormedError } from '../../error/WellFormedError';

// Force the loading of values into various error objects
import { wellFormedFatalErrors } from '../../error/wellFormedFatalErrors';
import { wellFormedWarnings } from '../../error/wellFormedWarnings';

fatalError.addMapping(wellFormedFatalErrors);
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
