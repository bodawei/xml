import { fatalError } from 'basic';
import { wellFormedFatalErrors } from './error/wellFormedFatalErrors';

export { ContentChecker } from './ContentChecker';
export { DocumentChecker } from './DocumentChecker';
export { MarkupDeclChecker } from './MarkupDeclChecker';
export { WellFormedError } from './error/WellFormedError';

fatalError.addMapping(wellFormedFatalErrors);
