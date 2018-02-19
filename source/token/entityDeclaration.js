/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import * as base from './base.js';
import entityEnd from './entityEnd.js';
import entityReference from './entityReference.js';
import entityStart from './entityStart.js';
import unassigned from './unassigned.js';
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
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(name, value, externalLoc, notationDataName, pToken);
      this.isParameter = true;
   }
}

class EntityDeclarationPToken extends declaration.PToken {
   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
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

      if (sToken.str === '%') {
         source.extractToObject('char', pToken, 'parameter');
         source.extractToObject('space', pToken, 'postParameterSpace');
      }

      parseWordOrPERef(source, pToken, () => {
         parseClose(source, pToken, deliverPToken);
      });
   });
}

function parseWordOrPERef(source, pToken, done) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', done, () => {
      // Consider "<!ENTITY % name". By strict syntax, tht can only be
      // a Parameter entity declaration.  However, because we want to allow
      // inappropriate spaces in non-strict mode, and if we actually have this:
      // "<!ENTITY % name ;" then we would consider that as an entity declaration
      // with a malformed PERef, and not an overall malformed ENTITY declaration.
      // The code here seeks to cope with this case.

      source.extractToObject('word', [ '>', '"', '\'', ';' ], pToken, 'name');
      source.extractToObject('space', pToken, 'postNameSpace');
      source.extract('match', ';', (semicolon) => {
         if (pToken.parameter && semicolon) {
            unassigned.parseAllValues(source, (values) => {
               const entityRef = new entityReference.ParamPToken({
                  open: pToken.parameter,
                  postOpenSpace: pToken.postParameterSpace,
                  name: pToken.name,
                  postNameSpace: pToken.postNameSpace,
                  close: semicolon,
               });
               pToken.unassigned = values;
               pToken.nextPropName = 'parameter';
               pToken.unassigned.unshift(entityRef);
               delete pToken.parameter;
               delete pToken.postParameterSpace;
               delete pToken.name;
               delete pToken.postNameSpace;
               done();
            });
         } else {
            parseEntityValue(source, pToken, done);
         }
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseEntityValue(source, pToken, done) {
   const callback = unassigned.makeCheckCallback(pToken, 'entityValueOrId', done, () => {
      literal.parse(source, {
         pToken,
         peRef: true,
      }, (gotQuoted) => {
         if (gotQuoted) {
            source.extract('space', (sToken) => {
               pToken.postEntityValueSpace = sToken;
               done();
            });
            return;
         }

         parseExternalId(source, pToken, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseExternalId(source, pToken, done) {
   const callback = unassigned.makeCheckCallback(pToken, 'entityValueOrId', done, () => {
      externalId.parse(source, [ '>' ], (externalId) => {
         pToken.externalId = externalId;
         pToken.unassigned = externalId && externalId.unassigned;

         if (!externalId || externalId.unassigned) {
            done();
            return;
         }

         source.extractToObject('space', pToken, 'postExternalIdSpace');
         parseNData(source, pToken, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseNData(source, pToken, done) {
   const callback = unassigned.makeCheckCallback(pToken, 'nData', done, () => {
      source.extract('peekWord', [ '>' ], (sToken) => {
         if (sToken && sToken.str.toLocaleUpperCase() === 'NDATA') {
            source.extractToObject('word', [ '>' ], pToken, 'nData');
            source.extract('space', (sToken) => {
               pToken.postNDataSpace = sToken;
               parseNDataName(source, pToken, done);
            });
         } else {
            done();
         }
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseNDataName(source, pToken, done) {
   const callback = unassigned.makeCheckCallback(pToken, 'nDataName', done, () => {
      source.extractToObject('word', [ '>' ], pToken, 'nDataName');
      source.extract('space', (sToken) => {
         pToken.postNDataNameSpace = sToken;
         done();
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source, pToken, deliverPToken) {
   source.extract('match', '>', (sToken) => {
      const deliveredPToken = !pToken.parameter ? pToken : new ParameterEntityDeclarationPToken(pToken);

      deliveredPToken.close = sToken;
      deliverPToken(deliveredPToken);
   });
}

/**********************************************************************\
 assignUnassigned()
\**********************************************************************/

function assignUnassigned(pToken) {
   const unValues = pToken.unassigned || [];

   if (unValues.length === 0) {
      delete pToken.unassigned;
      delete pToken.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => (item.type === entityReference.PARAM_PTYPE));

   if (unexpandedRef.length !== 0) {
      return;
   }

   const prolog = [
      { name: 'postDeclTypeSpace', type: 'space' },
      { name: 'parameter', type: 'word', allowed: /%/ },
      { name: 'postParameterSpace', type: 'space' },
      { name: 'name', type: 'word' },
      { name: 'postNameSpace', type: 'space' },
   ];
   const epilog = [
      { name: 'postExternalIdSpace', type: 'space' },
      { name: 'nData', type: 'word' },
      { name: 'postNDataSpace', type: 'space' },
      { name: 'nDataName', type: 'word' },
      { name: 'postNDataNameSpace', type: 'space' },
   ];

   // Help guide where to fill in the unassigned values
   const inProlog = prolog.filter((item) => item.name === pToken.nextPropName).length > 0;
   const inExternalId = !!(pToken.externalId && pToken.externalId.unassigned);
   const isEntityValueOrExternalId = pToken.nextPropName === 'entityValueOrId';
   const inEpilog = epilog.filter((item) => item.name === pToken.nextPropName).length > 0;
   let doEpilog = inEpilog.length > 0;

   if (inExternalId) {
      externalId.assignUnassigned(pToken.externalId, pToken, 'postNameSpace');
      doEpilog = true;
   } else {
      if (inProlog) {
         unassigned.assignToProps(pToken.unassigned, pToken, pToken.nextPropName, prolog);
      }

      if ((inProlog || isEntityValueOrExternalId) && pToken.unassigned[0]) {
         const nextThing = pToken.unassigned.find((value) => {
            if ((value.type === 'text' && value.subType === 'space') ||
               value.type === entityStart.PARAM_PTYPE ||
               value.type === entityEnd.PARAM_PTYPE) {
               return;
            }

            return value;
         });

         if (nextThing.type === 'literal') {
            unassigned.assignToProps(pToken.unassigned, pToken, 'EntityValue', [
               { name: 'postNameSpace', type: 'space' },
               { name: 'EntityValue', type: 'literal', flatten: true },
               { name: 'postEntityValueSpace', type: 'space' },
            ]);
         } else {
            pToken.externalId = {
               unassigned: pToken.unassigned,
            };
            externalId.assignUnassigned(pToken.externalId, pToken, 'postNameSpace');
            doEpilog = true;
         }
      }
   }

   if (doEpilog) {
      unassigned.assignToProps(pToken.unassigned, pToken, 'postExternalIdSpace', epilog);
   }

   if (unValues.length !== 0) {
      pToken.extra = pToken.unassigned;
   }

   if (pToken.externalId) {
      delete pToken.externalId.nextPropName;
      delete pToken.externalId.unassigned;
      delete pToken.externalId.extra;
   }

   delete pToken.nextPropName;
   delete pToken.unassigned;
}

/**********************************************************************\
 checkWellFormed() does normal validation.
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

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
         ec.check(pToken.nData.str !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, pToken.nData.str ]);
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

   unassigned.checkExtra(pToken.extra, ec, WFEID.ENTITYDECL_EXTRA_TEXT);
}

/**********************************************************************\
 pTokenToXToken() makes either a general or parmaeter entity token based
 on the PToken value.

 NOTE: The EntityValue is an array of PTokens. They are not XTokenized,
 as every consumer will need to further process them.
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
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,
};
