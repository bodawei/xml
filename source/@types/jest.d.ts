import { MockErrorCollector } from "error-test";

interface ErrorInfo {
   position: Position,
   id: string,
   params?: Array<string>,
   lastPosition?: Position
}

declare global {
   namespace jest {
     interface Matchers<R> {
      toNotReportError(mockErrorCollector: MockErrorCollector, expectedId: string): R;
      toReportWarning(mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo): R;
      toReportError(mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo): R;
     }
   }
 }
 
