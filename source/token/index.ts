/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import declaration from './bridge/baseDeclaration';

import attListDeclaration from './attListDeclaration';
import elementDeclaration from './elementDeclaration';

import * as charRef from './charRef';
import * as comment from './comment';
import { CommentXToken } from './comment';
import * as docTypeStart from './docTypeStart';
import * as docTypeEnd from './docTypeEnd';
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import text from './text';
import unassigned from './common/unassigned';
import literalValue from './common/literalValue';

export * from './processingInstruction';
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
export * from './generalEntityDeclaration';
export * from './generalEntityReference';
export * from './notationDeclaration';
export * from './parameterEntityDeclaration';
export * from './parameterEntityReference';
export * from './space';
export * from './textDeclaration';
export * from './xmlDeclaration';

type PToken = {
   type: string;
};

export {
   declaration,

   attListDeclaration,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   text,

   unassigned,
   literalValue,
   CommentXToken,
   PToken,
};
