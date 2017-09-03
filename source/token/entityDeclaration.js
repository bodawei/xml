/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import xmlToken from './xmlToken.js';
import externalId from './externalId.js';
import quotedValue from './quotedValue.js';
import util from './util.js';

const ENTITY_DECL = 'ENTITY_DECL';
const WFEID = WellFormedError.ID;

class EntityDeclaration extends xmlToken.Token {

   constructor(name, value, externalLoc, notationDataName, lTokens) {
      super(lTokens);

      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
   }

}

class ParameterEntityDeclaration extends EntityDeclaration {
   constructor(name, value, externalLoc, notationDataName, lTokens) {
      super(name, value, externalLoc, notationDataName, lTokens);
      this.isParameter = true;
   }
}

/**********************************************************************\
 parse() extracts the pieces of a documenttypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been parsed, and those
 lTokens are passed in through declarationStart.

 PARAM
 source: A LTokenSource to read from
 declarationStart: A hash with the lTokens from parsing "<!DOCTYPE S"
 deliverParsed: Callback to deliver the parsed lTokens

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

function parse(source, declarationParsing, deliverParsed) {
   const parsed = util.toLocalParsing(ENTITY_DECL, declarationParsing);

   source.extract('peekChar', (lToken) => {
      if (!lToken) {
         deliverParsed(parsed);
         return;
      }

      if (lToken.text === '%') {
         source.extractToObject('char', parsed, 'parameterLToken');
         source.extractToObject('space', parsed, 'postParameterSpaceLToken');
      }

      source.extractToObject('word', [ '>', '"', '\'' ], parsed, 'nameLToken');
      source.extractToObject('space', parsed, 'postNameSpaceLToken');

      source.extract('peekChar', (lToken) => {
         if (!lToken) {
            deliverParsed(parsed);
            return;
         }

         if (lToken.text === '"' || lToken.text === '\'') {
            quotedValue.parse(source, { params: true }, (result) => {
               parsed.entityValue = result;
               parseClose(source, parsed, 'postEntityValueSpaceLToken', deliverParsed);
            });
         } else {
            externalId.parse(source, [ '>' ], (externalId) => {
               parsed.externalId = externalId;
               if (!externalId) {
                  parseClose(source, parsed, undefined, deliverParsed);
                  return;
               }

               source.extractToObject('space', parsed, 'postExternalIdSpaceLToken');
               source.extract('peekWord', [ '>' ], (lToken) => {
                  if (lToken && lToken.text.toLocaleUpperCase() === 'NDATA') {
                     source.extractToObject('word', [ '>' ], parsed, 'nDataLToken');
                     source.extractToObject('space', parsed, 'postNDataSpaceLToken');
                     source.extractToObject('word', [ '>' ], parsed, 'nDataNameLToken');
                     parseClose(source, parsed, 'postNDataNameSpaceLToken', deliverParsed);
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
   source.extract('match', '>', (lToken) => {
      parsed.closeLToken = lToken;
      deliverParsed(parsed);
   });
}

function getChunks(parsed) {
   const results = [];

   util.pIfNotBottom(results, parsed.openLToken);
   util.pIfNotBottom(results, parsed.postOpenSpaceLToken);
   util.pIfNotBottom(results, parsed.declTypeLToken);
   util.pIfNotBottom(results, parsed.postDeclTypeSpaceLToken);
   util.pIfNotBottom(results, parsed.parameterLToken);
   util.pIfNotBottom(results, parsed.postParameterSpaceLToken);
   util.pIfNotBottom(results, parsed.nameLToken);
   util.pIfNotBottom(results, parsed.postNameSpaceLToken);
   quotedValue.getChunks(results, parsed.entityValue);
   externalId.getChunks(results, parsed.externalId);
   util.pIfNotBottom(results, parsed.postEntityValueSpaceLToken);
   util.pIfNotBottom(results, parsed.postExternalIdSpaceLToken);

   util.pIfNotBottom(results, parsed.nDataLToken);
   util.pIfNotBottom(results, parsed.postNDataSpaceLToken);
   util.pIfNotBottom(results, parsed.nDataNameLToken);
   util.pIfNotBottom(results, parsed.postNDataNameSpaceLToken);

   util.pIfNotBottom(results, parsed.closeLToken);

   return results;
}

function checkWellFormed(parsed, ec) {
   const enNameText = util.textOrBlank(parsed.nameLToken);
   ec.setPos(parsed.openLToken);

   // 1. Do general check on a declaration here. including space after entity

   ec.setPos(parsed.parameterLToken);
   if (parsed.parameterLToken) {
      ec.setPos(parsed.postParameterSpaceLToken);
      ec.check(!parsed.postParameterSpaceLToken, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ enNameText ]);
   }

   ec.setPos(parsed.nameLToken);
   ec.check(!parsed.nameLToken, WFEID.ENTITYDECL_NO_NAME);
   ec.checkName(parsed.nameLToken, WFEID.ENTITYDECL_NAME_INVALID, parsed.openLToken);
   // 2. Add name recommendations tests
   // const error = util.checkNameRecommendations(enNameText, this._entityMd,
   //    XWID.ENTITYDECL_NAME_XMLDASH_RESERVED, XWID.ENTITYDECL_NAME_XML_RESERVED);
   // this._checkWarn(!error, error, [ enNameText ]);
   ec.setPos(parsed.postNameSpaceLToken);
   ec.check(!parsed.postNameSpaceLToken, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (parsed.externalId) {
      this._validateExternalId(parsed.externalId, ec, true);

      if (parsed.nDataLToken) {
         ec.check(parsed.nDataLToken.text !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, parsed.nDataLToken.text ]);
         ec.check(!parsed.nDataNameLToken, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
      // 3. XmlText.validateText(parsed.nDataName, this._entityMd, parsed.start, this);
      }
   } else if (parsed.entityValue) {
      // 4. this._validateParsedQuotedValue(parsed.value, {
      //    validateEntityValue: true
      // });
   } else {
      ec.report(WFEID.ENTITYDECL_NO_VALUE, [ enNameText ]);
   }

   ec.setPos(parsed.closeLToken);
   ec.check(!parsed.closeLToken, WFEID.ENTITYDECL_NO_CLOSE, [ enNameText ]);

   // 5. this._checkDeclarationState(parsed.start, WFEID.ENTITYDECL_INVALID_CONTEXT);
}

function makeToken(parsed) {
   const entityClass = parsed.parameterLToken ? ParameterEntityDeclaration : EntityDeclaration;

   return new entityClass(util.textOrBlank(parsed.nameLToken),
      util.textOrBlank(parsed.entityValue ? parsed.entityValue.valueLToken : undefined),
      {},
      util.textOrBlank(parsed.nDataNameLToken),
      getChunks(parsed));
}

module.exports = {
   TYPE: ENTITY_DECL,
   Token: EntityDeclaration,
   ParamToken: ParameterEntityDeclaration,
   parse,
   checkWellFormed,
   makeToken,
};
