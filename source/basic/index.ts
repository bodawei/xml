/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

type XmlVersion = 1.0 | 1.1;
type XmlRevision = 1 | 2 | 3 | 4 | 5 | 6;

export { default as Offset } from './Offset';
export { default as Range } from './Range';
export * from './StringBundle';
export * from './token';
export * from './conformanceVersion';
export * from './entityId';
export * from './chars';
export * from './doAsyncLoop';
export * from './extractSurrogatePair';
export {
   XmlVersion,
   XmlRevision,
};