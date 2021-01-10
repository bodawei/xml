/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

export * from './WellFormedError';
export { ERROR_TYPE } from './BaseError';
export * from './XmlWarning';

interface ErrorLocale{
   code: {
      [name: string]: number;
   };
   id: {
      [name: string]: string;
   };
   message: {
      [locale: string]: {
         [name: string]: string;
      };
   };
};

// Maybe temp, as we extract errors into other places
export { ErrorLocale };
export { BaseError, MessageCache, Position } from './BaseError';