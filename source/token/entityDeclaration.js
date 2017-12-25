/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import * as base from './base.js';
import * as declaration from './bridge/declaration.js';
import misc from './common/misc.js';
import externalId from './common/externalId.js';
import literal from './common/literal.js';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const ENTITYDECL = 'ENTITYDECL';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

class EntityDeclaration extends base.XToken {

   constructor(name, value, externalLoc, notationDataName, pToken) {
      super(pToken);

      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
   }

}

class ParameterEntityDeclaration extends EntityDeclaration {
   constructor(name, value, externalLoc, notationDataName, pToken) {
      super(name, value, externalLoc, notationDataName, pToken);
      this.isParameter = true;
   }
}

class EntityDeclarationPToken extends declaration.PToken {
   constructor(props) {
      super(ENTITYDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, literal.getSTokens(this)); // eslint-disable-line prefer-spread
      results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      results.pushSTokens(this.postEntityValueSpace,
         this.postExternalIdSpace,
         this.nData,
         this.postNDataSpace,
         this.nDataName,
         this.postNDataNameSpace,
         this.close);

      return results;
   }
}

class ParameterEntityDeclarationPToken extends base.PToken {
   constructor(props) {
      super(ENTITYDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.declType,
         this.postDeclTypeSpace,
         this.parameter,
         this.postParameterSpace,
         this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, literal.getSTokens(this)); // eslint-disable-line prefer-spread
      results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      results.pushSTokens(this.postEntityValueSpace,
         this.postExternalIdSpace,
         this.nData,
         this.postNDataSpace,
         this.nDataName,
         this.postNDataNameSpace,
         this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts extracts the STokens that make up a general or
 parameteter entity declaration.

 As is common with all declaration things, the STokens for the
 "<!DOCTYPE S" part are passed in as the second argument.

 PARAM
   source: An STokenSource to read from
   declarationPToken: A map with the sTokens from parsing "<!DOCTYPE S"
   deliverPToken: Callback to deliver the PTokens

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

function parse(source, declarationPToken, deliverPToken) {
   const pToken = new EntityDeclarationPToken(declarationPToken);

   source.extract('peekChar', (sToken) => {
      if (!sToken) {
         deliverPToken(pToken);
         return;
      }

      if (sToken.text === '%') {
         source.extractToObject('char', pToken, 'parameter');
         source.extractToObject('space', pToken, 'postParameterSpace');
      }

      source.extractToObject('word', [ '>', '"', '\'' ], pToken, 'name');
      source.extractToObject('space', pToken, 'postNameSpace');

      literal.parse(source, {
         pToken,
         peRef: true,
      }, (gotQuoted) => {
         if (gotQuoted) {
            parseClose(source, pToken, 'postEntityValueSpace', deliverPToken);
         } else {
            externalId.parse(source, [ '>' ], (externalId) => {
               pToken.externalId = externalId;
               if (!externalId) {
                  parseClose(source, pToken, undefined, deliverPToken);
                  return;
               }

               source.extractToObject('space', pToken, 'postExternalIdSpace');
               source.extract('peekWord', [ '>' ], (sToken) => {
                  if (sToken && sToken.text.toLocaleUpperCase() === 'NDATA') {
                     source.extractToObject('word', [ '>' ], pToken, 'nData');
                     source.extractToObject('space', pToken, 'postNDataSpace');
                     source.extractToObject('word', [ '>' ], pToken, 'nDataName');
                     parseClose(source, pToken, 'postNDataNameSpace', deliverPToken);
                  } else {
                     parseClose(source, pToken, undefined, deliverPToken);
                  }
               });
            });
         }
      });
   });
}

function parseClose(source, pToken, propName, deliverPToken) {
   if (propName) {
      source.extractToObject('space', pToken, propName);
   }
   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;

      if (pToken.parameter) {
         deliverPToken(new ParameterEntityDeclarationPToken(pToken));
      } else {
         deliverPToken(pToken);
      }
   });
}

/**********************************************************************\
 checkWellFormed() does normal validation.
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   const enNameText = misc.textOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.parameter);
   if (pToken.parameter) {
      ec.setPos(pToken.postParameterSpace);
      ec.check(!pToken.postParameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ enNameText ]);
   }

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ENTITYDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ENTITYDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.ENTITYDECL_NAME_XMLDASH_RESERVED, WARN.ENTITYDECL_NAME_XML_RESERVED);
   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (pToken.externalId) {
      externalId.checkWellFormed(pToken.externalId, ec, entityMetaData);

      if (pToken.nData) {
         ec.setPos(pToken.nData);
         ec.check(pToken.nData.text !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, pToken.nData.text ]);
         ec.setPos(pToken.nDataName);
         ec.check(!pToken.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
         misc.checkWellFormedText(pToken.nDataName, ec, entityMetaData);
      }
   } else if (pToken.value) {
      literal.checkWellFormed(pToken, ec, entityMetaData, WFEID.NOUN_ENTITYVALUE);
   } else {
      ec.setPos(undefined);
      ec.report(WFEID.ENTITYDECL_NO_VALUE, [ enNameText ]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ENTITYDECL_NO_CLOSE, [ enNameText ]);
}

/**********************************************************************\
 pTokenToXToken() makes either a general or parmaeter entity token based
 on the PToken value.

 It is worth mentioning that the EntityValue is an array of STokens
 and PTokens. They are not XTokenized, as every consumer will need
 to do some kind of additional parsing of these.
\**********************************************************************/

function pTokenToXToken(pToken) {
   const entityClass = pToken.parameter ? ParameterEntityDeclaration : EntityDeclaration;

   return new entityClass(misc.textOrBlank(pToken.name),
      pToken.value,
      externalId.makeEntityLocation(pToken.externalId),
      misc.textOrBlank(pToken.nDataName),
      pToken);
}

export {
   ENTITYDECL as PTYPE,
   EntityDeclarationPToken as PToken,
   ParameterEntityDeclarationPToken as ParamPToken,
   EntityDeclaration as XToken,
   ParameterEntityDeclaration as ParamXToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
