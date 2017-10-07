/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import * as declaration from './declaration.js';
import * as envelope from './envelope.js';
import * as instruction from './instruction.js';

import * as cdata from './cdata.js';
import * as charData from './charData.js';
import * as comment from './comment.js';
import * as docTypeStart from './docTypeStart.js';
import * as docTypeEnd from './docTypeEnd.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as entityEnd from './entityEnd.js';
import * as entityReference from './entityReference.js';
import * as entityStart from './entityStart.js';
import * as elementStart from './elementStart.js';
import * as elementEnd from './elementEnd.js';
import * as space from './space.js';
import * as text from './text.js';
import * as notationDeclaration from './notationDeclaration.js';
import * as processingInstruction from './processingInstruction.js';
import * as xmlDeclaration from './xmlDeclaration.js';

module.exports = {
   declaration,
   envelope,
   instruction,

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
};
