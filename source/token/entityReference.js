/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import xmlToken from './xmlToken.js';
import util from './util.js';

const ENTITY_REFERENCE = 'ENTITY_REFERENCE';
const WFEID = WellFormedError.ID;

class EntityReference extends xmlToken.Token {

   constructor(name, lTokens) {
      super(lTokens);

      this.name = name;
   }

}

/**********************************************************************\
 parse() extracts the pieces of an entity reference.

 This assumes that the initial & has not been read.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
    [67] Reference   ::= EntityRef | CharRef
    [68] EntityRef   ::= '&' Name ';'
    [69] PEReference ::= '%' Name ';'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: ENTITY_REFERENCE,
   };

   source.extractToObject('match', '&', parsed, 'openLToken');
   source.extractToObject('space', parsed, 'postOpenSpaceLToken');
   source.extractToObject('word', [ ';' ], parsed, 'entityNameLToken');
   source.extractToObject('space', parsed, 'postEntityNameSpaceLToken');
   source.extract('match', [ ';' ], (lToken) => {
      parsed.closeLToken = lToken;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, ec) {
   const entityName = util.textOrBlank(parsed.entityNameLToken);

   ec.setPos(parsed.openLToken);
   ec.setPos(parsed.postOpenSpaceLToken);
   ec.check(parsed.postOpenSpaceLToken, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]); // @@@ param

   ec.setPos(parsed.entityNameLToken);
   ec.check(!parsed.entityNameLToken, WFEID.REFERENCE_NO_NAME);

   ec.setPos(parsed.postEntityNameSpaceLToken);
   ec.check(parsed.postEntityNameSpaceLToken, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(parsed.closeLToken);
   ec.check(!parsed.closeLToken, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

function makeToken(parsed) {
   return new EntityReference(util.textOrBlank(parsed.nameLToken), []);
}

module.exports = {
   TYPE: ENTITY_REFERENCE,
   Token: EntityReference,
   parse,
   checkWellFormed,
   makeToken,
};
