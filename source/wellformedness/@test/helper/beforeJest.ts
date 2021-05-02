import { expect } from '@jest/globals';
import { makeErrorMatcher } from 'basic-test';

import { fatalError } from 'basic';
import { WellFormedError } from '../../error/WellFormedError';

// Force the loading of values into various error objects
import { wellFormedFatalErrors } from '../../error/wellFormedFatalErrors';
fatalError.addMapping(wellFormedFatalErrors);

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
