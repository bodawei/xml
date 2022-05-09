import { expect } from '@jest/globals';

import { makeNewErrorMatcher } from 'basic-test';

import { validCodes } from '../../error/validCodes';

expect.extend({
   toReportValidityError: makeNewErrorMatcher(validCodes),
});

export { validCodes };
