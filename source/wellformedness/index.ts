import { error, warning } from 'basic';
import { wellFormedErrors } from './error/wellFormedErrors';
import { wellFormedWarnings } from './error/wellFormedWarnings';
export { ContentChecker } from './ContentChecker';
export { DocumentChecker } from './DocumentChecker';
export { MarkupDeclChecker } from './MarkupDeclChecker';
export { WellFormedError } from './error/WellFormedError';

warning.addMapping(wellFormedWarnings);
error.addMapping(wellFormedErrors);
