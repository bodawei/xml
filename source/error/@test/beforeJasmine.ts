import { StringBundle, XmlWarning } from 'basic';
import { MockErrorCollector, ErrorInfo } from 'basic-test';
import { WellFormedError } from 'error';


// @ts-ignore
import warningMessages from '../derive/XmlWarning.json';
// @ts-ignore
import wellFormedMessages from '../derive/WellFormedError.json';

const messages: { [errorTypeName: string]: StringBundle } = {
   XmlWarning: new StringBundle(warningMessages.message),
   WellFormedError: new StringBundle(wellFormedMessages.message),
};


function toHaveError(util: any) {
   return {
      compare: (actual: any, expected: any) => {
         let pass = false;
         let message;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE') {
               pass = pass || util.equals(token, expected);
            }
         });

         if (pass) {
            message = `Expected not to find "${JSON.stringify(expected, undefined, 2)}".`;
         } else {
            message = `Expected to find "${JSON.stringify(expected, undefined, 2)}". Instead found ${JSON.stringify(actual, undefined, 2)}.`;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

function toBeErrorFree() {
   return {
      compare: (actual: any) => {
         let error: WellFormedError | void;
         let message: string;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE' && token.subtype !== 'WARNING') {
               error = token;
            }
         });

         if (!error!) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${(error! as any).message}. (${(error! as any).id})`; // typeHack
         }

         return {
            pass: !error!,
            message: message,
         };
      },
   };
}

function toBeErrorAndWarningFree() {
   return {
      compare: (actual: any) => {
         let error: XmlWarning | WellFormedError | void;
         let message: string;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE') {
               error = token;
            }
         });

         if (!error!) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${(error! as any).message}. (${(error! as any).id})`; // typeHack
         }

         return {
            pass: !error!,
            message: message,
         };
      },
   };
}


function toNotReportError(util: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedId: string) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected.');
         }

         const errors = mockErrorCollector.errors;
         let pass = true;
         let message = `No error with the id ${expectedId} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual = errors[index];

            if (expectedId === actual.id) {
                  pass = false;
                  message = `The error ${expectedId} was found.`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function toReportError(util: any) {
   return makeCompareObject(util, WellFormedError);
}

function toReportWarning(util: any) {
   return makeCompareObject(util, XmlWarning);
}

function makeCompareObject(util: any, ErrorClass: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedError: ErrorInfo) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected.');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const actual = errors[index];

            if (expectedError.id === actual.id) {
               let errMsg;
               
               if (ErrorClass.MSG_BUNDLE) {
                  errMsg = ErrorClass.MSG_BUNDLE.lookup(actual.id || '', 'base');
               } else {
                  errMsg = messages[ErrorClass.name].lookup(actual.id || '', 'base');
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
                  message = `Parameters for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${actual.params}\n  Expected: ${expectedError.params}`;
               } else if (!util.equals(expectedError.position, actual.position)) {
                  message = `Positions for ${expectedError.id} do not match:\n` +
                     `  Actual:   ${JSON.stringify(actual.position)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.position)}`;
               } else if ((expectedError.lastPosition || !expectedError.position) &&
                  !util.equals(expectedError.lastPosition, actual.lastPosition)) {
                  message = `Last positions for ${expectedError.id} do not match:\n` +
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

if (typeof jest === 'undefined') {
   beforeEach(() => {
      jasmine.addMatchers({
         toHaveError,
         toBeErrorFree,
         toBeErrorAndWarningFree,
         toReportError,
         toNotReportError,
         toReportWarning,
      });
   });
}


interface ErrorProps {
   id: string,
   params?: Array<string>,
   position?: any,
   lastPosition?: any,
}

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toHaveError(expectedXmlErrorInstance: any): void; // given tokens: Array<any>, 
         toBeErrorFree(): void; // given tokens: Array<any>
         toBeErrorAndWarningFree(): void; // given tokens: Array<any>
         toReportError(errorProps: ErrorProps): void;
         toNotReportError(id: string): void;
         toReportWarning(errorProps: ErrorProps): void;
      }
   }
}

export {
   toReportError, toReportWarning,
}