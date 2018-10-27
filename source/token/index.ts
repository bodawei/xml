/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import declaration from './bridge/declaration';
import * as instruction from './bridge/instruction';

import attListDeclaration from './attListDeclaration';
import * as charData from './charData';
import * as charRef from './charRef';
import * as comment from './comment';
import { CommentXToken } from './comment';
import * as docTypeStart from './docTypeStart';
import * as docTypeEnd from './docTypeEnd';
import * as entityDeclaration from './entityDeclaration';
import elementDeclaration from './elementDeclaration';
import entityReference from './entityReference';
import entityStart from './entityStart';
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import * as space from './space';
import text from './text';
import * as notationDeclaration from './notationDeclaration';
export * from './processingInstruction';
import unassigned from './common/unassigned';
import * as xmlDeclaration from './xmlDeclaration';

import literalValue from './common/literalValue';
export * from './parameterEntityEnd';
export * from './bridge/section';

export * from './cdata';
export * from './externalSubsetEnd';
export * from './externalSubsetStart';
export * from './generalEntityEnd';
export * from './internalSubsetEnd';
export * from './internalSubsetStart';

const token = {
   declaration,
   instruction,

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
   entityReference,
   entityStart,
   notationDeclaration,
   space,
   text,
   xmlDeclaration,

   unassigned,

   literalValue,
};

export {
   declaration,
   instruction,

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
   entityReference,
   entityStart,
   notationDeclaration,
   space,
   text,
   xmlDeclaration,

   unassigned,

   literalValue,

   CommentXToken,
};

export default token;
