import { expect } from '@jest/globals';

import { error, warning } from 'basic';
import { makeNewErrorMatcher } from 'basic-test';

import { warningCodes } from '../../error/warningCodes';
import { errorCodes } from '../../error/errorCodes';
import { validCodes } from '../../error/validCodes';

warning.addMapping(warningCodes);
error.addMapping(errorCodes);

expect.extend({
   toReportValidityError: makeNewErrorMatcher(validCodes),
});

export { validCodes };
