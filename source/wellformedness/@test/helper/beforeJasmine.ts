import { makeJasmineErrorMatcher } from 'basic-test';
import { WellFormedError } from '../../error/WellFormedError';

function toReportWFError(util: any) {
   return makeJasmineErrorMatcher(util, WellFormedError);
}
if (typeof jest === 'undefined') {
   beforeEach(() => {
      jasmine.addMatchers({
         toReportWFError,
      });
   });
}

interface ErrorProps {
   id: string;
   params?: Array<string>;
   position?: any;
   lastPosition?: any;
}

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toReportWFError(errorProps: ErrorProps): void;
      }
   }
}

export { toReportWFError };
