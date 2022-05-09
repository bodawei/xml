import { expect } from '@jest/globals';

import { error } from 'basic';
import { makeNewErrorMatcher } from 'basic-test';

import { errorCodes } from '../../error/errorCodes';
import { validCodes } from '../../error/validCodes';

error.addMapping(errorCodes);

expect.extend({
   toReportValidityError: makeNewErrorMatcher(validCodes),
});

export { validCodes };
