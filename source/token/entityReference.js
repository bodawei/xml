/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import xmlToken from './xmlToken.js';
import util from './util.js';

const ENTITY_REFERENCE = 'ENTITY_REFERENCE';
const WFEID = WellFormedError.ID;

class EntityReference extends xmlToken.Token {

   constructor(name, chunks) {
      super(chunks);

      this.name = name;
   }

}

/**********************************************************************\
 parse() extracts the pieces of an entity reference.

 This assumes that the initial & has not been read.

 PARAM
 source: A ChunkSource to read from
 deliverParsed: Callback to deliver the parsed chunks

 SYNTAX
    [67] Reference   ::= EntityRef | CharRef
    [68] EntityRef   ::= '&' Name ';'
    [69] PEReference ::= '%' Name ';'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: ENTITY_REFERENCE,
   };

   source.extractToObject('match', '&', parsed, 'openChunk');
   source.extractToObject('space', parsed, 'postOpenSpaceChunk');
   source.extractToObject('word', [ ';' ], parsed, 'entityNameChunk');
   source.extractToObject('space', parsed, 'postEntityNameSpaceChunk');
   source.extract('match', [ ';' ], (chunk) => {
      parsed.closeChunk = chunk;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, ec) {
   const entityName = util.textOrBlank(parsed.entityNameChunk);

   ec.check(parsed.postOpenSpaceChunk, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]); // @@@ param
   ec.check(!parsed.entityNameChunk, WFEID.REFERENCE_NO_NAME);
   ec.check(parsed.postEntityNameSpaceChunk, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);
   ec.check(!parsed.closeChunk, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

function makeToken(parsed) {
   return new EntityReference(util.textOrBlank(parsed.nameChunk), []);
}

module.exports = {
   TYPE: ENTITY_REFERENCE,
   Token: EntityReference,
   parse,
   checkWellFormed,
   makeToken,
};
