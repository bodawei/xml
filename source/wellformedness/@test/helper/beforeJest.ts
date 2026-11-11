import { expect } from '@jest/globals';
import { makeProblemMatcher } from 'basic-test';

import { errorCodes } from '../../error/errorCodes';
import { fatalErrorCodes } from '../../error/fatalErrorCodes';
import { warningCodes } from '../../error/warningCodes';
import { WellFormedError } from '../../error/wellFormedError';
import { wellFormedErrorCodes } from '../../error/wellFormedError';

expect.extend({
   toHaveWellFormedError: makeProblemMatcher(wellFormedErrorCodes),
   toHaveWFError: makeProblemMatcher(errorCodes),
   toHaveWFFatalError: makeProblemMatcher(fatalErrorCodes),
   toHaveWFWarning: makeProblemMatcher(warningCodes),
});

// declare global {
//    namespace jasmine {
//       interface Matchers<T> {
//          toReportWFError(errorProps: ErrorProps): void;
//       }
//    }
// }

export { WellFormedError };
