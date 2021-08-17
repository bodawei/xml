/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { error, warning } from 'basic';
import { warningCodes } from './error/warningCodes';
import { errorCodes } from './error/errorCodes';

export { ValidityError } from './error/validityError';
export { ValidityChecker } from './validityChecker';

warning.addMapping(warningCodes);
error.addMapping(errorCodes);
