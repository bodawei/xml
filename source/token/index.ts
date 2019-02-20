/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import declaration from './bridge/baseDeclaration';

import attListDeclaration from './attListDeclaration';
import elementDeclaration from './elementDeclaration';

import * as docTypeStart from './docTypeStart';
import * as docTypeEnd from './docTypeEnd';
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import unassigned from './common/unassigned';
import literalValue from './common/literalValue';
export * from './entityDeclaration';

export * from './bridge/declaration';
export * from './bridge/instruction';
export * from './bridge/section';

export * from './marker/externalSubsetEnd';
export * from './marker/externalSubsetStart';
export * from './marker/generalEntityEnd';
export * from './marker/generalEntityStart';
export * from './marker/internalSubsetEnd';
export * from './marker/internalSubsetStart';
export * from './marker/parameterEntityEnd';
export * from './marker/parameterEntityStart';

export * from './cdata';
export * from './charData';
export * from './charRef';
export * from './comment';
export * from './elementEnd';
export * from './generalEntityDeclaration';
export * from './generalEntityReference';
export * from './notationDeclaration';
export * from './parameterEntityDeclaration';
export * from './parameterEntityReference';
export * from './processingInstruction';
export * from './space';
export * from './text';
export * from './textDeclaration';
export * from './xmlDeclaration';

type PToken = {
   type: string;
   [key: string]: any;
};

export {
   declaration,

   attListDeclaration,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,

   unassigned,
   literalValue,
   PToken,
};
