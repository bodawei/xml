import { error, warning } from 'basic';
import { warningCodes } from './error/warningCodes';
import { errorCodes } from './error/errorCodes';

export { ValidityError } from './error/ValidityError';
export { ValidityChecker } from './ValidityChecker';

warning.addMapping(warningCodes);
error.addMapping(errorCodes);
