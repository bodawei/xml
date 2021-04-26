/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { BaseError } from './BaseError';
import { ConformanceVersion } from './conformanceVersion';
import { EntityId } from './entityId';

type XmlVersion = 1.0 | 1.1;
type XmlEdition = 1 | 2 | 3 | 4 | 5 | 6;

type BaseToken = BaseError | EntityId | ConformanceVersion;

interface ErrorLocale {
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
}

export { BaseToken, ErrorLocale };

export { default as Offset } from './Offset';
export { default as Range } from './Range';
export { default as ErrorCollector } from './ErrorCollector';
export * from './BaseError';
export * from './XmlWarning';
export * from './StringBundle';
export * from './token';
export * from './conformanceVersion';
export * from './entityId';
export * from './chars';
export * from './doAsyncLoop';
export * from './doAsyncWhileLoop';
export * from './extractSurrogatePair';
export * from './XmlError';
export * from './XmlFatalError';
export { XmlVersion, XmlEdition };
