import { ValidityError, WellFormedError, ERROR_TYPE, XmlWarning } from 'error';

function toHaveError(util: any) {
   return {
      compare: (actual: any, expected: any) => {
         let pass = false;
         let message;

         actual.forEach((token: any) => {
            if (token instanceof XmlWarning || token instanceof ValidityError || token instanceof WellFormedError) {
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
         let error: ValidityError | WellFormedError | void;
         let message: string;

         actual.forEach((token: any) => {
            if (token instanceof ValidityError || token instanceof WellFormedError) {
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
         let error: XmlWarning | ValidityError | WellFormedError | void;
         let message: string;

         actual.forEach((token: any) => {
            if (token instanceof XmlWarning || token instanceof ValidityError || token instanceof WellFormedError) {
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

beforeEach(() => {
   jasmine.addMatchers({
      toHaveError,
      toBeErrorFree,
      toBeErrorAndWarningFree,
   });
});
