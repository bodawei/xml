import { error } from 'basic';
import { wellFormedErrors } from './error/wellFormedErrors';
export { ContentChecker } from './ContentChecker';
export { DocumentChecker } from './DocumentChecker';
export { MarkupDeclChecker } from './MarkupDeclChecker';
export { WellFormedError } from './error/WellFormedError';
export { WellFormedWarning } from './error/wellFormedWarning';

error.addMapping(wellFormedErrors);
