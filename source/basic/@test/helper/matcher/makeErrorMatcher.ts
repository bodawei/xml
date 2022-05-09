import { ErrorCodes } from '../../../klass/errorCodes';
import { ErrorInfo } from '../errorInfo';
import { MockErrorCollector } from '../../helper';

interface SyncExpectationResult {
   pass: boolean;
   message: () => string;
}
type AsyncExpectationResult = Promise<SyncExpectationResult>;
type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;
type Tester = (a: unknown, b: unknown) => boolean | undefined;

interface MatcherState {
   assertionCalls: number;
   currentTestName?: string;
   dontThrow?: () => void;
   error?: Error;
   equals: (
      a: unknown,
      b: unknown,
      customTesters?: Array<Tester>,
      strictCheck?: boolean,
   ) => boolean;
   expand?: boolean;
   expectedAssertionsNumber?: number | null;
   expectedAssertionsNumberError?: Error;
   isExpectingAssertions?: boolean;
   isExpectingAssertionsError?: Error;
   isNot: boolean;
   promise: string;
   suppressedErrors: Array<Error>;
   // testPath?: Config.Path;
   // utils: typeof jestMatcherUtils & {
   //    iterableEquality: Tester;
   //    subsetEquality: Tester;
   // };
}

function makeErrorMatcher(errorCodes?: ErrorCodes) {
   return function (
      this: MatcherState,
      mockErrorCollector: MockErrorCollector | undefined,
      expectedErrorInfo: ErrorInfo,
   ): ExpectationResult {
      if (!mockErrorCollector) {
         throw new Error('Did not get a mock error collector as expected.');
      }

      const errors = mockErrorCollector.errors;
      let pass = false;
      let message = `No error with the id ${expectedErrorInfo.id} reported.`;

      for (let index = 0; index < errors.length; index++) {
         const actual: any = errors[index];

         if (expectedErrorInfo.id === actual.id) {
            // const errMsg = ''; /// outch

            // Fix this.
            // if (errorCodes.codeFor(expectedErrorInfo.id)) {
            //    errMsg = errorCodes.messageTemplateFor(actual.id);
            // } else {
            //    throw new Error('no messages provided');
            // }

            // if (false) {
            //    // !errMsg) {
            //    // pass = false;
            //    // message = `The error ${expectedErrorInfo.id} is not a legal error ID.`;
            //    // break;
            // } else {
            //    let count = 0;
            //    let offset = errMsg.indexOf('{0}');

            //    while (offset !== -1) {
            //       count++;
            //       offset = errMsg.indexOf(`{${count}}`);
            //    }

            //    const params = actual.params || [];
            //    if (count !== params.length) {
            //       pass = false;
            //       message = `${expectedErrorInfo.id} expects ${count} parameters, but ${params.length} found.`;
            //       break;
            //    }
            // }

            if (!this.equals(expectedErrorInfo.params, actual.params)) {
               message =
                  `Parameters for ${expectedErrorInfo.id} do not match:\n` +
                  `  Actual:   ${actual.params}\n  Expected: ${expectedErrorInfo.params}`;
            } else if (!this.equals(expectedErrorInfo.position, actual.position)) {
               message =
                  `Positions for ${expectedErrorInfo.id} do not match:\n` +
                  `  Actual:   ${JSON.stringify(actual.position)}\n` +
                  `  Expected: ${JSON.stringify(expectedErrorInfo.position)}`;
            } else if (
               (expectedErrorInfo.lastPosition || !expectedErrorInfo.position) &&
               !this.equals(expectedErrorInfo.lastPosition, actual.lastPosition)
            ) {
               message =
                  `Last positions for ${expectedErrorInfo.id} do not match:\n` +
                  `  Actual:   ${JSON.stringify(actual.lastPosition)}\n` +
                  `  Expected: ${JSON.stringify(expectedErrorInfo.lastPosition)}`;
            } else {
               pass = true;
               message = `Error matching ${expectedErrorInfo.id} was found, but should not have been.`;
            }
         }
      }

      return {
         pass,
         message: () => message,
      };
   };
}

export { makeErrorMatcher };
