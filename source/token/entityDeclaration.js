/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import xmlToken from './xmlToken.js';
import externalId from './externalId.js';
import quotedValue from './quotedValue.js';
import util from './util.js';

const ENTITY_DECL = 'ENTITY_DECL';
const WFEID = WellFormedError.ID;

class EntityDeclaration extends xmlToken.Token {

   constructor(name, value, externalLoc, notationDataName, chunks) {
      super(chunks);

      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
   }

}

class ParameterEntityDeclaration extends EntityDeclaration {
   constructor(name, value, externalLoc, notationDataName, chunks) {
      super(name, value, externalLoc, notationDataName, chunks);
      this.isParameter = true;
   }
}

/**********************************************************************\
 parse() extracts the pieces of a documenttypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been parsed, and those
 chunks are passed in through declarationStart.

 PARAM
 source: A ChunkSource to read from
 declarationStart: A hash with the chunks from parsing "<!DOCTYPE S"
 deliverParsed: Callback to deliver the parsed chunks

 SYNTAX
   [70] EntityDecl  ::= GEDecl | PEDecl
   [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
   [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
   [74] PEDef       ::= EntityValue | ExternalID
   [76] NDataDecl   ::= S 'NDATA' S Name
    [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                        "'" ([^%&'] | PEReference | Reference)* "'"
\**********************************************************************/

function parse(source, declarationStart, deliverParsed) {
   const parsed = {
      type: ENTITY_DECL,
      openChunk: declarationStart.openChunk,
      postOpenSpaceChunk: declarationStart.postOpenSpaceChunk,
      declTypeChunk: declarationStart.declTypeChunk,
      postDeclTypeSpaceChunk: declarationStart.postDeclTypeSpaceChunk,
   };

   source.extract('peekChar', (chunk) => {
      if (!chunk) {
         deliverParsed(parsed);
         return;
      }

      if (chunk.text === '%') {
         source.extractToObject('char', parsed, 'parameterChunk');
         source.extractToObject('space', parsed, 'postParameterSpaceChunk');
      }

      source.extractToObject('word', [ '>', '"', '\'' ], parsed, 'nameChunk');
      source.extractToObject('space', parsed, 'postNameSpaceChunk');

      source.extract('peekChar', (chunk) => {
         if (!chunk) {
            deliverParsed(parsed);
            return;
         }

         if (chunk.text === '"' || chunk.text === '\'') {
            quotedValue.parse(source, { params: true }, (result) => {
               parsed.entityValue = result;
               parseClose(source, parsed, 'postEntityValueSpaceChunk', deliverParsed);
            });
         } else {
            externalId.parse(source, [ '>' ], (externalId) => {
               parsed.externalId = externalId;
               if (!externalId) {
                  parseClose(source, parsed, undefined, deliverParsed);
                  return;
               }

               source.extractToObject('space', parsed, 'postExternalIdSpaceChunk');
               source.extract('peekWord', [ '>' ], (chunk) => {
                  if (chunk && chunk.text.toLocaleUpperCase() === 'NDATA') {
                     source.extractToObject('word', [ '>' ], parsed, 'nDataChunk');
                     source.extractToObject('space', parsed, 'postNDataSpaceChunk');
                     source.extractToObject('word', [ '>' ], parsed, 'nDataNameChunk');
                     parseClose(source, parsed, 'postNDataNameSpaceChunk', deliverParsed);
                  } else {
                     parseClose(source, parsed, undefined, deliverParsed);
                  }
               });
            });
         }
      });
   });
}

function parseClose(source, parsed, propName, deliverParsed) {
   if (propName) {
      source.extractToObject('space', parsed, propName);
   }
   source.extract('match', '>', (chunk) => {
      parsed.closeChunk = chunk;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, ec, isDocEntity, version, revision) {
   const enNameText = util.textOrBlank(parsed.nameChunk);
   ec.setPos(parsed.openChunk);

   // 1. Do general check on a declaration here. including space after entity

   if (parsed.parameterChunk) {
      ec.check(!parsed.postParameterSpaceChunk, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE);
   }

   ec.setPos(parsed.nameChunk);
   ec.check(!parsed.nameChunk, WFEID.ENTITYDECL_NO_NAME);
   ec.checkName(parsed.nameChunk, WFEID.ENTITYDECL_NAME_INVALID, parsed.openChunk);
   // 2. Add name recommendations tests
   // const error = util.checkNameRecommendations(enNameText, this._entityMd,
   //    XWID.ENTITYDECL_NAME_XMLDASH_RESERVED, XWID.ENTITYDECL_NAME_XML_RESERVED);
   // this._checkWarn(!error, error, [ enNameText ]);
   ec.setPos(parsed.postNameSpaceChunk);
   ec.check(!parsed.postNameSpaceChunk, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (parsed.externalId) {
      this._validateExternalId(parsed.externalId, ec, true);

      if (parsed.nDataChunk) {
         ec.check(parsed.nDataChunk.text !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE, [ enNameText, parsed.nDataChunk.text ]);
         ec.check(!parsed.nDataNameChunk, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
      // 3. XmlText.validateText(parsed.nDataName, this._entityMd, parsed.start, this);
      }
   } else if (parsed.entityValue) {
      // 4. this._validateParsedQuotedValue(parsed.value, {
      //    validateEntityValue: true
      // });
   } else {
      ec.report(WFEID.ENTITYDECL_NO_VALUE, [ enNameText ]);
   }

   ec.setPos(parsed.closeChunk);
   ec.check(!parsed.closeChunk, WFEID.ENTITYDECL_NO_CLOSE, [ enNameText ]);

   // 5. this._checkDeclarationState(parsed.start, WFEID.ENTITYDECL_INVALID_CONTEXT);
}

function makeToken(parsed) {
   const entityClass = parsed.parameterChunk ? ParameterEntityDeclaration : EntityDeclaration;

   return new entityClass(util.textOrBlank(parsed.nameChunk),
      util.textOrBlank(parsed.entityValue ? parsed.entityValue.valueChunk : undefined),
      {},
      util.textOrBlank(parsed.nDataNameChunk),
      []);
}

module.exports = {
   TYPE: ENTITY_DECL,
   Token: EntityDeclaration,
   ParamToken: ParameterEntityDeclaration,
   parse,
   checkWellFormed,
   makeToken,
};
