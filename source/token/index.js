/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import declaration from './declaration.js';
import docTypeStart from './docTypeStart.js';
import docTypeEnd from './docTypeEnd.js';
import entityDeclaration from './entityDeclaration.js';
import entityReference from './entityReference.js';
import externalId from './externalId.js';
import processingInstruction from './processingInstruction.js';
import xmlDeclaration from './xmlDeclaration.js';

module.exports = {
   declaration,
   externalId,
   docTypeStart,
   docTypeEnd,
   processingInstruction,
   xmlDeclaration,
   entityDeclaration,
   entityReference,
};
