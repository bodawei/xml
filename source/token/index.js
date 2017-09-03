/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as docTypeEnd from './docTypeEnd.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as entityReference from './entityReference.js';
import * as externalId from './externalId.js';
import * as processingInstruction from './processingInstruction.js';
import * as xmlDeclaration from './xmlDeclaration.js';

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
