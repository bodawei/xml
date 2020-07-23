/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { STokenSource } from 'sToken';

import { DeclarationStart } from './bridge/declaration';
import unassigned from './common/unassigned';
import { parseExternalId } from './common/externalId';
import literal from './common/literal';
import { CharRefPToken } from './charRef';
import { TextPToken } from './text';
import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from './marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from './parameterEntityReference';
import { GeneralEntityDeclarationPToken } from './generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from './parameterEntityDeclaration';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

type EntityValueElement = TextPToken|CharRefPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken;
type EntityValuePToken = Array<EntityValueElement>;

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
         source.extractToObjectNoParams('space', pToken, 'parameterSpace');
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
      source.extractToObjectNoParams('space', pToken, 'nameSpace');
      source.extract('match', ';', (semicolon) => {
         if (pToken.parameter && semicolon) {
            unassigned.parseAllValues(source, false, (values) => {
               const entityRef = new ParameterEntityReferencePToken({
                  open: pToken.parameter!,  // typeHack
                  openSpace: pToken.parameterSpace,
                  name: pToken.name,
                  nameSpace: pToken.nameSpace,
                  close: semicolon,
               });
               (pToken as any).unassigned = values;
               (pToken as any).nextPropName = 'parameter';
               (pToken.unassigned as any).unshift({  // typeHack
                  type: 'reference',
                  token: entityRef,
               });
               (pToken as any).peRefPlus = (pToken as any).unassigned;
               delete (pToken as any).parameter;
               delete (pToken as any).parameterSpace;
               delete (pToken as any).name;
               delete (pToken as any).nameSpace;
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
      // §4.5 defines that we should be parsing charRefs and pe refs here
      literal.parse(source, {
         pToken,
         peRef: true,
         charRef: true,
      }, (appendedPToken) => {
         if (appendedPToken) {
            source.extractNoParams('space', (sToken) => {
               (pToken as any).entityValueSpace = sToken;
               done();
            });
            return;
         }

         parseExternalIdOfEntity(source, pToken, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseExternalIdOfEntity(source: STokenSource, pToken: GeneralEntityDeclarationPToken, done: () => void) {
   const callback = unassigned.makeCheckCallback(pToken, 'entityValueOrId', done, () => {
      parseExternalId(source, [ '>' ], true, (parsedResult) => {
         (pToken as any).externalId = parsedResult.externalId;
         (pToken as any).unassigned = parsedResult.peRefPlus;
         (pToken as any).peRefPlus = parsedResult.peRefPlus;
         (pToken as any).nextPropName = parsedResult.nextPropName;

         if (!parsedResult.externalId || parsedResult.peRefPlus.length > 0) {
            done();
            return;
         }

         source.extractToObjectNoParams('space', pToken, 'externalIdSpace');

         if (!pToken.parameter) {
            parseNData(source, pToken, done);
         } else {
            done();
         }
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
               (pToken as any).nDataSpace = sToken;
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
         (pToken as any).nDataNameSpace = sToken;
         done();
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source: STokenSource, pToken: GeneralEntityDeclarationPToken, deliverPToken: (result: GeneralEntityDeclarationPToken|ParameterEntityDeclarationPToken) => void) {
   source.extract('match', '>', (sToken) => {
      const deliveredPToken = !pToken.parameter ? pToken : new ParameterEntityDeclarationPToken(pToken);

      (deliveredPToken as any).close = sToken;
      deliverPToken(deliveredPToken);
   });
}

export {
   EntityValueElement,
   EntityValuePToken,
   parse as parseEntityDeclaration,

};
