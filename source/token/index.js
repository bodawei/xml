/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import declaration from './bridge/declaration';
import * as envelope from './bridge/envelope.js';
import * as instruction from './bridge/instruction.js';

import attListDeclaration from './attListDeclaration';
import * as cdata from './cdata.js';
import * as charData from './charData.js';
import * as comment from './comment.js';
import * as docTypeStart from './docTypeStart.js';
import * as docTypeEnd from './docTypeEnd.js';
import * as entityDeclaration from './entityDeclaration.js';
import entityEnd from './entityEnd.js';
import entityReference from './entityReference.js';
import entityStart from './entityStart.js';
import * as elementStart from './elementStart.js';
import * as elementEnd from './elementEnd.js';
import * as space from './space.js';
import text from './text.js';
import * as notationDeclaration from './notationDeclaration.js';
import * as processingInstruction from './processingInstruction.js';
import unassigned from './unassigned';
import * as xmlDeclaration from './xmlDeclaration.js';

module.exports = {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
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
};
