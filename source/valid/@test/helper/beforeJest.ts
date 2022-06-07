import { expect } from '@jest/globals';
import { makeProblemMatcher } from 'basic-test';

import { errorCodes } from '../../error/errorCodes';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { warningCodes } from '../../error/warningCodes';

expect.extend({
   toHaveValidityError: makeProblemMatcher(validityErrorCodes),
   toHaveValidWarning: makeProblemMatcher(warningCodes),
   toHaveValidError: makeProblemMatcher(errorCodes),
});

export { validityErrorCodes };
