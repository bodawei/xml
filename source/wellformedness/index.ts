import { fatalError, warning } from 'basic';
import { wellFormedFatalErrors } from './error/wellFormedFatalErrors';
import { wellFormedWarnings } from './error/wellFormedWarnings';

export { ContentChecker } from './ContentChecker';
export { DocumentChecker } from './DocumentChecker';
export { MarkupDeclChecker } from './MarkupDeclChecker';
export { WellFormedError } from './error/WellFormedError';

warning.addMapping(wellFormedWarnings);
fatalError.addMapping(wellFormedFatalErrors);
