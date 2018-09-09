/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import declaration from './bridge/declaration';
import * as envelope from './bridge/envelope';
import * as instruction from './bridge/instruction';

import attListDeclaration from './attListDeclaration';
import * as cdata from './cdata';
import * as charData from './charData';
import charRef from './charRef';
import comment from './comment';
import * as docTypeStart from './docTypeStart';
import * as docTypeEnd from './docTypeEnd';
import * as entityDeclaration from './entityDeclaration';
import entityEnd from './entityEnd';
import elementDeclaration from './elementDeclaration';
import entityReference from './entityReference';
import entityStart from './entityStart';
import * as elementStart from './elementStart';
import * as elementEnd from './elementEnd';
import * as space from './space';
import text from './text';
import * as notationDeclaration from './notationDeclaration';
import * as processingInstruction from './processingInstruction';
import unassigned from './unassigned';
import * as xmlDeclaration from './xmlDeclaration';

import literalValue from './common/literalValue';

const token = {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   entityEnd,
   entityReference,
   entityStart,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,

   unassigned,

   literalValue,
};

export {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   entityEnd,
   entityReference,
   entityStart,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,

   unassigned,

   literalValue,
};

export default token;
