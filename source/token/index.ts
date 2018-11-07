/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import declaration from './bridge/declaration';

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
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import * as space from './space';
import text from './text';
import * as notationDeclaration from './notationDeclaration';
export * from './processingInstruction';
import unassigned from './common/unassigned';
import * as xmlDeclaration from './xmlDeclaration';

import literalValue from './common/literalValue';
export * from './bridge/section';

export * from './bridge/instruction';
export * from './marker/externalSubsetEnd';
export * from './marker/externalSubsetStart';
export * from './marker/generalEntityEnd';
export * from './marker/generalEntityStart';
export * from './marker/internalSubsetEnd';
export * from './marker/internalSubsetStart';
export * from './marker/parameterEntityEnd';
export * from './marker/parameterEntityStart';
export * from './cdata';
export * from './xmlDeclaration';

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
   entityReference,
   notationDeclaration,
   space,
   text,
   xmlDeclaration,

   unassigned,

   literalValue,
};

const parseXmlDeclaration = xmlDeclaration.parseXmlDeclaration;

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
   entityReference,
   notationDeclaration,
   space,
   text,
   xmlDeclaration,
   parseXmlDeclaration,

   unassigned,

   literalValue,

   CommentXToken,
};

export default token;
