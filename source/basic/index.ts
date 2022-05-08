/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from './conformanceVersion';
import { EntityId } from './entityId';
import { XmlErrorToken } from './error/XmlErrorToken';

type XmlVersion = 1.0 | 1.1;
type XmlEdition = 1 | 2 | 3 | 4 | 5 | 6;

type BaseToken = XmlErrorToken | EntityId | ConformanceVersion;

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
export * from './token';
export * from './conformanceVersion';
export * from './entityId';
export * from './chars';
export * from './doAsyncLoop';
export * from './doAsyncWhileLoop';
export * from './extractSurrogatePair';
export { XmlVersion, XmlEdition };

export { ErrorCodes } from './error/errorCodes';
export { makeOffset } from './error/makeOffset';
export { XML_ERROR_TOKEN, XmlErrorPosition, XmlErrorToken } from './error/XmlErrorToken';
export { ERROR_SUBTYPE, ErrorToken } from './error/ErrorToken';
export { FATAL_ERROR_SUBTYPE, FatalErrorToken } from './error/FatalErrorToken';
export { WARNING_SUBTYPE, WarningToken } from './error/WarningToken';
export { error } from './error/error';
export { fatalError } from './error/fatalError';
export { warning } from './error/warning';
