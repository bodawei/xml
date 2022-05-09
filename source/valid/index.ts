/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { error } from 'basic';
import { errorCodes } from './error/errorCodes';

export { ValidityError } from './error/validityError';
export { ValidityChecker } from './validityChecker';

error.addMapping(errorCodes);
