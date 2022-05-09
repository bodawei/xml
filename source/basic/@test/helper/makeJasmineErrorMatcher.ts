import { MockErrorCollector, ErrorInfo } from './helper';

function makeJasmineErrorMatcher(util: any, ErrorClass: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected.');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual: any = errors[index];

            if (expectedError.id === actual.id) {
               let errMsg;

               if (ErrorClass.MSG_BUNDLE) {
                  errMsg = ErrorClass.MSG_BUNDLE.lookup(actual.id || '', 'base');
               } else {
                  throw new Error('no message bunle in jasmine');
               }

               if (!errMsg) {
                  pass = false;
                  message = `The error ${expectedError.id} is not a legal error ID.`;
                  break;
               } else {
                  let count = 0;
                  let offset = errMsg.indexOf('{');

                  while (offset !== -1) {
                     count++;
                     offset = errMsg.indexOf('{', offset + 1);
                  }

                  const params = actual.params || [];
                  if (count !== params.length) {
                     pass = false;
                     message = `${expectedError.id} expects ${count} parameters, but ${params.length} found.`;
                     break;
                  }
               }

               if (!util.equals(expectedError.params, actual.params)) {
                  message =
                     `Parameters for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${actual.params}\n  Expected: ${expectedError.params}`;
               } else if (!util.equals(expectedError.position, actual.position)) {
                  message =
                     `Positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.position)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.position)}`;
               } else if (
                  (expectedError.lastPosition || !expectedError.position) &&
                  !util.equals(expectedError.lastPosition, actual.lastPosition)
               ) {
                  message =
                     `Last positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.lastPosition)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.lastPosition)}`;
               } else {
                  pass = true;
                  message = `Error matching ${expectedError.id} was found, but should not have been.`;
               }
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function makeNewJasmineErrorMatcher(util: any, codes?: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected.');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual: any = errors[index];

            if (expectedError.id === actual.id) {
               let errMsg;

               // errMsg = codes.messageFor(actual.id);

               // if (!errMsg) {
               //    pass = false;
               //    message = `The error ${expectedError.id} is not a legal error ID.`;
               //    break;
               // } else {
               //    let count = 0;
               //    let offset = errMsg.indexOf('{');

               //    while (offset !== -1) {
               //       count++;
               //       offset = errMsg.indexOf('{', offset + 1);
               //    }

               //    const params = actual.params || [];
               //    if (count !== params.length) {
               //       pass = false;
               //       message = `${expectedError.id} expects ${count} parameters, but ${params.length} found.`;
               //       break;
               //    }
               // }

               if (!util.equals(expectedError.params, actual.params)) {
                  message =
                     `Parameters for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${actual.params}\n  Expected: ${expectedError.params}`;
               } else if (!util.equals(expectedError.position, actual.position)) {
                  message =
                     `Positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.position)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.position)}`;
               } else if (
                  (expectedError.lastPosition || !expectedError.position) &&
                  !util.equals(expectedError.lastPosition, actual.lastPosition)
               ) {
                  message =
                     `Last positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.lastPosition)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.lastPosition)}`;
               } else {
                  pass = true;
                  message = `Error matching ${expectedError.id} was found, but should not have been.`;
               }
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

export { makeJasmineErrorMatcher, makeNewJasmineErrorMatcher };
