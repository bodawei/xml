/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError, XmlWarning, ErrorCollector } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import { DeclarationStart } from './bridge/declaration';
import unassigned, { UnassignedType, UnassignedArray } from './common/unassigned';
import misc from './common/misc';
import externalId, { ExternalId } from './common/externalId';
import literal, { LiteralValuePToken } from './common/literal';
import { UnassignedValue } from './common/unassigned';
import { TextPToken } from './text';
import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from './marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from './parameterEntityReference';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const GENERAL_ENTITY_DECLARATION_PTOKEN = 'GENERAL_ENTITY_DECLARATION_PTOKEN';
const PARAMETER_ENTITY_DECLARATION_PTOKEN = 'PARAMETER_ENTITY_DECLARATION_PTOKEN';
const GENERAL_ENTITY_DECLARATION_XTOKEN = 'GENERAL_ENTITY_DECLARATION_XTOKEN';
const PARAMETER_ENTITY_DECLARATION_XTOKEN = 'PARAMETER_ENTITY_DECLARATION_XTOKEN';

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;

class GeneralEntityDeclarationXToken {
   public type: string = GENERAL_ENTITY_DECLARATION_XTOKEN;
   public name: string;
   public externalLoc: EntityLocation | void;
   public notationDataName: string | void;
   public isParameter: boolean;
   public value: ExpandedLiteralValuePToken;
   public pToken?: GeneralEntityDeclarationPToken;

   constructor(name: string, value: ExpandedLiteralValuePToken, externalLoc?: EntityLocation | void, notationDataName?: string | void, pToken?: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
      this.pToken = pToken;
   }
}

class ParameterEntityDeclarationXToken {
   public type: string = PARAMETER_ENTITY_DECLARATION_XTOKEN;
   public name: string;
   public isParameter: boolean;
   public externalLoc: EntityLocation | void;
   public value: ExpandedLiteralValuePToken;
   public pToken?: ParameterEntityDeclarationPToken;

   constructor(name: string, value: ExpandedLiteralValuePToken, externalLoc?: EntityLocation | void, pToken?: ParameterEntityDeclarationPToken) {
      this.name = name;
      this.isParameter = true;
      this.value = value;
      this.externalLoc = externalLoc;
      this.pToken = pToken;
   }
}

class GeneralEntityDeclarationPToken {
   public type: string = GENERAL_ENTITY_DECLARATION_PTOKEN;
   public open: SToken;
   public openSpace?: SToken;
   public declType?: SToken;
   public declTypeSpace?: SToken;
   public parameter?: SToken;
   public postParameterSpace?: SToken;
   public name?: SToken;
   public postNameSpace?: SToken;
   public externalId?: ExternalId;
   public postExternalIdSpace?: SToken;
   public value: LiteralValuePToken;
   public postEntityValueSpace?: SToken;
   public nData?: SToken;
   public postNDataSpace?: SToken;
   public nDataName?: SToken;
   public postNDataNameSpace?: SToken;
   public close?: SToken;
   public unassigned?: UnassignedArray;
   public extra?: UnassignedArray;
   public nextPropName?: string;

   constructor(props?: Object | DeclarationStart) {
      if (props) {
         Object.assign(this, props);
         this.open = (props as any).open;
         this.value = (props as any).value || [];
      } else {
         this.open = SToken.fromString('x');
         this.value = [];
      }
      this.type = GENERAL_ENTITY_DECLARATION_PTOKEN;
   }

   getSTokenArray() {
      // const results = super.getSTokenArray();

      // results.pushSTokens(this.name,
      //    this.postNameSpace);
      // results.pushSTokens.apply(results, literal.getSTokens(this as any)); // eslint-disable-line prefer-spread  // typeHack
      // results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      // results.pushSTokens(this.postEntityValueSpace,
      //    this.postExternalIdSpace,
      //    this.nData,
      //    this.postNDataSpace,
      //    this.nDataName,
      //    this.postNDataNameSpace,
      //    this.close);

      // return results;
   }
}

class ParameterEntityDeclarationPToken {
   public type: string = PARAMETER_ENTITY_DECLARATION_PTOKEN;
   public open: SToken;
   public openSpace?: SToken;
   public declType?: SToken;
   public declTypeSpace?: SToken;
   public parameter?: SToken;
   public postParameterSpace?: SToken;
   public name?: SToken;
   public postNameSpace?: SToken;
   public externalId?: ExternalId;
   public value: LiteralValuePToken;
   public postEntityValueSpace?: SToken;
   public postExternalIdSpace?: SToken;
   public close?: SToken;
   public unassigned?: UnassignedArray;
   public extra?: UnassignedArray;
   public nextPropName?: string;

   constructor(props?: Object | DeclarationStart) {
      if (props) {
         Object.assign(this, props);
         this.open = (props as any).open;
         this.value = (props as any).value || [];
      } else {
         this.open = SToken.fromString('x');
         this.value = [];
      }
      this.type = PARAMETER_ENTITY_DECLARATION_PTOKEN;
   }

   getSTokenArray() {
      // const hack = new base.PToken('x');
      // const results = hack.getSTokenArray();

      // results.pushSTokens(this.open,
      //    this.postOpenSpace,
      //    this.declType,
      //    this.postDeclTypeSpace,
      //    this.parameter,
      //    this.postParameterSpace,
      //    this.name,
      //    this.postNameSpace);
      // results.pushSTokens.apply(results, literal.getSTokens(this as any)); // eslint-disable-line prefer-spread // typeHack
      // results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      // results.pushSTokens(this.postEntityValueSpace,
      //    this.postExternalIdSpace,
      //    this.close);

      // return results;
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
   § 4.2
   [70] EntityDecl  ::= GEDecl | PEDecl
   [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
   [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
   [74] PEDef       ::= EntityValue | ExternalID
   [76] NDataDecl   ::= S 'NDATA' S Name
    [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                        "'" ([^%&'] | PEReference | Reference)* "'"
\**********************************************************************/

function parse(source: STokenSource, declarationStart: DeclarationStart, deliverPToken: (pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) => void) {
   const pToken = new GeneralEntityDeclarationPToken(declarationStart);

   source.extractNoParams('peekChar', (sToken) => {
      if (!sToken) {
         deliverPToken(pToken);
         return;
      }

      if (sToken.str === '%') {
         source.extractToObjectNoParams('char', pToken, 'parameter');
         source.extractToObjectNoParams('space', pToken, 'postParameterSpace');
      }

      parseWordOrPERef(source, pToken, () => {
         parseClose(source, pToken, deliverPToken);
      });
   });
}

function parseWordOrPERef(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', done, () => {
      // Consider "<!ENTITY % name". By strict syntax, tht can only be
      // a Parameter entity declaration.  However, because we want to allow
      // inappropriate spaces in non-strict mode, and if we actually have this:
      // "<!ENTITY % name ;" then we would consider that as an entity declaration
      // with a malformed PERef, and not an overall malformed ENTITY declaration.
      // The code here seeks to cope with this case.

      source.extractToObject('word', [ '>', '"', '\'', ';' ], pToken, 'name');
      source.extractToObjectNoParams('space', pToken, 'postNameSpace');
      source.extract('match', ';', (semicolon) => {
         if (pToken.parameter && semicolon) {
            unassigned.parseAllValues(source, false, (values) => {
               const entityRef = new ParameterEntityReferencePToken({
                  open: pToken.parameter!,  // typeHack
                  openSpace: pToken.postParameterSpace,
                  name: pToken.name,
                  nameSpace: pToken.postNameSpace,
                  close: semicolon,
               });
               pToken.unassigned = values;
               pToken.nextPropName = 'parameter';
               (pToken.unassigned as any).unshift({  // typeHack
                  type: 'reference',
                  token: entityRef,
               });
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

function parseEntityValue(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'entityValueOrId', done, () => {
      literal.parse(source, {
         pToken,
         peRef: true,
         charRef: true,
      }, (appendedPToken) => {
         if (appendedPToken) {
            source.extractNoParams('space', (sToken) => {
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

function parseExternalId(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'entityValueOrId', done, () => {
      externalId.parse(source, [ '>' ], (externalId) => {
         pToken.externalId = externalId;
         pToken.unassigned = externalId && externalId.unassigned;

         if (!externalId || externalId.unassigned) {
            done();
            return;
         }

         source.extractToObjectNoParams('space', pToken, 'postExternalIdSpace');
         parseNData(source, pToken, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseNData(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'nData', done, () => {
      source.extract('peekWord', [ '>' ], (sToken) => {
         if (sToken && sToken.str.toLocaleUpperCase() === 'NDATA') {
            source.extractToObject('word', [ '>' ], pToken, 'nData');
            source.extractNoParams('space', (sToken) => {
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

function parseNDataName(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'nDataName', done, () => {
      source.extractToObject('word', [ '>' ], pToken, 'nDataName');
      source.extractNoParams('space', (sToken) => {
         pToken.postNDataNameSpace = sToken;
         done();
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source: STokenSource, pToken: GeneralEntityDeclarationPToken, deliverPToken: (result: GeneralEntityDeclarationPToken|ParameterEntityDeclarationPToken) => void) {
   source.extract('match', '>', (sToken) => {
      const deliveredPToken = !pToken.parameter ? pToken : new ParameterEntityDeclarationPToken(pToken);

      deliveredPToken.close = sToken;
      deliverPToken(deliveredPToken);
   });
}

/**********************************************************************\
 assignUnassigned()
\**********************************************************************/

function assignUnassigned(pToken: GeneralEntityDeclarationPToken) {
   const unValues = pToken.unassigned || [];

   if (unValues.length === 0) {
      delete pToken.unassigned;
      delete pToken.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item: UnassignedValue) => (item.type === 'reference'));

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
   const inEpilog = epilog.filter((item) => item.name === pToken.nextPropName);
   let doEpilog = inEpilog.length > 0;

   if (inExternalId) {
      externalId.assignUnassigned(pToken.externalId as ExternalId, pToken, 'postNameSpace'); // typeHack
      doEpilog = true;
   } else {
      if (inProlog) {
         unassigned.assignToProps(pToken.unassigned!, pToken, pToken.nextPropName, prolog); // typeHack
      }

      if ((inProlog || isEntityValueOrExternalId) && pToken.unassigned![0]) { // typeHack
         const nextNonSpaceThing = (pToken.unassigned as any).find((value: UnassignedValue) => { // typeHack
            if ((value.type === 'space') ||
               value.type === 'entityStart' ||
               value.type === UnassignedType.ENTITY_END) {
               return;
            }

            return value;
         });

         if (nextNonSpaceThing.type === 'literal') {
            unassigned.assignToProps(pToken.unassigned!, pToken, 'EntityValue', [ // typeHack
               { name: 'postNameSpace', type: 'space' },
               { name: 'EntityValue', type: 'literal', flatten: true },
               { name: 'postEntityValueSpace', type: 'space' },
            ]);
         } else {
            pToken.externalId = {
               unassigned: pToken.unassigned,
            } as ExternalId; // typeHack
            externalId.assignUnassigned(pToken.externalId, pToken, 'postNameSpace');
            doEpilog = true;
         }
      }
   }

   if (doEpilog) {
      unassigned.assignToProps(pToken.unassigned!, pToken, 'postExternalIdSpace', epilog); // typeHack
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

function checkWellFormed(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   const enNameText = strOrBlank(pToken.name);

//   declaration.checkWellFormed((pToken as any), ec, entityMetaData); // TypeHack

   ec.setPos(pToken.parameter);
   if (pToken.parameter) {
      ec.setPos(pToken.postParameterSpace);
      ec.check(!pToken.postParameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ enNameText ]);
   }

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ENTITYDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ENTITYDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData, 'ENTITY',
      WARN.ENTITYDECL_NAME_XMLDASH_RESERVED, WARN.ENTITYDECL_NAME_XML_RESERVED);
   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (pToken.externalId) {
      externalId.checkWellFormed(pToken.externalId, ec, entityMetaData);

      if (pToken instanceof GeneralEntityDeclarationPToken && pToken.nData) {
         ec.setPos(pToken.nData);
         ec.check(pToken.nData.str !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, pToken.nData.str ]);
         ec.setPos(pToken.nDataName);
         ec.check(!pToken.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
         misc.checkWellFormedText(pToken.nDataName, ec, entityMetaData);
      }
   } else if (pToken.value) {
      literal.checkWellFormed(pToken as any, ec, entityMetaData, WFEID.NOUN_ENTITYVALUE); // typeHack
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

function pTokenToXToken(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
   if (pToken.parameter) {
      return new ParameterEntityDeclarationXToken(strOrBlank(pToken.name),
         pToken.value as any,
         externalId.makeEntityLocation(pToken.externalId),
         pToken as any);
   } else {
      return new GeneralEntityDeclarationXToken(strOrBlank(pToken.name),
         pToken.value as any,
         externalId.makeEntityLocation(pToken.externalId),
         strOrBlank((pToken as GeneralEntityDeclarationPToken).nDataName),
         pToken);
   }
}

export {
   parse as parseEntityDeclaration,
   parse,
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,

   GENERAL_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_XTOKEN,
   PARAMETER_ENTITY_DECLARATION_XTOKEN,

   GeneralEntityDeclarationXToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationXToken,
   ParameterEntityDeclarationPToken,
   ExpandedLiteralValuePToken,
};
