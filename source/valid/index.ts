import { error, warning } from 'basic';
import { validWarnings } from './error/validWarnings';
import { validError } from './error/validError';

export { ValidityError } from './error/ValidityError';
export { ValidityChecker } from './ValidityChecker';

warning.addMapping(validWarnings);
error.addMapping(validError);
