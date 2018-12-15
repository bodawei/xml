/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import declaration from './bridge/baseDeclaration';

import attListDeclaration from './attListDeclaration';
import * as charData from './charData';
import * as charRef from './charRef';
import * as comment from './comment';
import { CommentXToken } from './comment';
import * as docTypeStart from './docTypeStart';
import * as docTypeEnd from './docTypeEnd';
import elementDeclaration from './elementDeclaration';
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import * as space from './space';
import text from './text';
import * as notationDeclaration from './notationDeclaration';
import unassigned from './common/unassigned';
import literalValue from './common/literalValue';

import * as entityDeclaration from './entityDeclaration';
export * from './entityDeclaration';

export * from './processingInstruction';

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
export * from './generalEntityReference';
export * from './parameterEntityReference';
export * from './textDeclaration';
export * from './xmlDeclaration';

type PToken = {
   type: string;
};

const token = {
   declaration,

   attListDeclaration,
   charData,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   notationDeclaration,
   space,
   text,

   unassigned,

   literalValue,
};

export {
   declaration,

   attListDeclaration,
   charData,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   notationDeclaration,
   space,
   text,

   unassigned,
   literalValue,
   CommentXToken,
   PToken,
};

export default token;
