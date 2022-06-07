import { expect } from '@jest/globals';
import { makeProblemMatcher } from 'basic-test';

import { WellFormedError } from '../../error/wellFormedError';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';
import { fatalErrorCodes } from '../../error/fatalErrorCodes';
import { errorCodes } from '../../error/errorCodes';

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
