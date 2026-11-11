/* Copyright ® 2026 by 柏大衛. All rights reserved. */

import { makeProblemMatcher } from 'basic-test';
import { expect } from 'vitest';

import { errorCodes } from '../../error/errorCodes';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { warningCodes } from '../../error/warningCodes';

expect.extend({
   toHaveValidityError: makeProblemMatcher(validityErrorCodes),
   toHaveValidWarning: makeProblemMatcher(warningCodes),
   toHaveValidError: makeProblemMatcher(errorCodes),
});

export { validityErrorCodes };
