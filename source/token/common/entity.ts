/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import {  EntityMetaData } from 'basic';
import { WellFormedError, XmlWarning, ErrorCollector } from 'error';
import { strOrBlank } from 'sToken';

import unassigned, { UnassignedType } from '../common/unassigned';
import misc from '../common/misc';
import {  checkExternalIdWellFormed } from '../common/externalId';
import literal from '../common/literal';
import { UnassignedValue } from '../common/unassigned';
import { TextPToken } from '../text';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';
import { GeneralEntityDeclarationPToken } from '../generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../parameterEntityDeclaration';
import { assignExternalId } from 'source/expand/unassigned/assignExternalId';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;

/**********************************************************************\
 assignUnassigned()
\**********************************************************************/

function assignUnassigned(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
   const unValues = pToken.unassigned || [];

   if (unValues.length === 0) {
      delete (pToken as any).unassigned;
      delete (pToken as any).nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item: UnassignedValue) => (item.type === 'reference'));

   if (unexpandedRef.length !== 0) {
      return;
   }

   const prolog = [
      { name: 'declTypeSpace', type: 'space' },
      { name: 'parameter', type: 'word', allowed: /%/ },
      { name: 'parameterSpace', type: 'space' },
      { name: 'name', type: 'word' },
      { name: 'nameSpace', type: 'space' },
   ];
   const epilog = [
      { name: 'externalIdSpace', type: 'space' },
      { name: 'nData', type: 'word' },
      { name: 'nDataSpace', type: 'space' },
      { name: 'nDataName', type: 'word' },
      { name: 'nDataNameSpace', type: 'space' },
   ];

   // Help guide where to fill in the unassigned values
   const inProlog = prolog.filter((item) => item.name === pToken.nextPropName).length > 0;
   const inExternalId = !!pToken.externalId;
   const isEntityValueOrExternalId = pToken.nextPropName === 'entityValueOrId';
   const inEpilog = epilog.filter((item) => item.name === pToken.nextPropName);
   let doEpilog = inEpilog.length > 0;

   if (inExternalId) {
      const results = assignExternalId(unValues, pToken.nextPropName, pToken.externalId);
      if (results.preSpace) {
         if (pToken.nameSpace) {
            pToken.nameSpace.merge(results.preSpace);
         } else {
            (pToken as any).nameSpace = results.preSpace;
         }
      }
   
      if (results.externalId) {
         (pToken as any).externalId = results.externalId;
      }

      (pToken as any).unassigned = results.unassigned;
   
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
               { name: 'nameSpace', type: 'space' },
               { name: 'EntityValue', type: 'literal', flatten: true },
               { name: 'entityValueSpace', type: 'space' },
            ]);
         } else {
            const results = assignExternalId(pToken.unassigned!, undefined, pToken.externalId);
            if (results.preSpace) {
               if (pToken.nameSpace) {
                  pToken.nameSpace.merge(results.preSpace);
               } else {
                  (pToken as any).nameSpace = results.preSpace;
               }
            }
         
            if (results.externalId) {
               (pToken as any).externalId = results.externalId;
            }
      
            (pToken as any).unassigned = results.unassigned;
      
            doEpilog = true;
         }
      }
   }

   if (doEpilog) {
      unassigned.assignToProps(pToken.unassigned!, pToken, 'externalIdSpace', epilog); // typeHack
   }

   if (unValues.length !== 0) {
      (pToken as any).extra = pToken.unassigned;
   }

   delete (pToken as any).nextPropName;
   delete (pToken as any).unassigned;
}

/**********************************************************************\
 checkWellFormed() does normal validation.
\**********************************************************************/

function checkWellFormed(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || (pToken.unassigned && pToken.unassigned.length > 0)) {
      return;
   }

   const enNameText = strOrBlank(pToken.name);

   //   declaration.checkWellFormed((pToken as any), ec, entityMetaData); // TypeHack
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'ENTITY', WFEID.ENTITYDECL_DECLTYPE_INVALID, [ declType ]);

   ec.setPos(pToken.parameter);
   if (pToken.parameter) {
      ec.setPos(pToken.parameterSpace);
      ec.check(!pToken.parameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ enNameText ]);
   }

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ENTITYDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ENTITYDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData, 'ENTITY',
      WARN.ENTITYDECL_NAME_XMLDASH_RESERVED, WARN.ENTITYDECL_NAME_XML_RESERVED);
   ec.setPos(pToken.nameSpace);
   ec.check(!pToken.nameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (pToken.externalId) {
      checkExternalIdWellFormed(pToken.externalId, ec, entityMetaData);

      if (pToken instanceof GeneralEntityDeclarationPToken && pToken.nData) {
         ec.setPos(pToken.externalIdSpace);
         ec.check(!pToken.externalIdSpace, WFEID.ENTITYDECL_EXTERNALID_NO_SPACE, [ enNameText ]);

         ec.setPos(pToken.nData);
         ec.check(pToken.nData.str !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, pToken.nData.str ]);
         ec.setPos(pToken.nDataName);
         ec.check(!pToken.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
         misc.checkCharWellFormed(pToken.nDataName, ec, entityMetaData);
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

export {
   assignUnassigned,
   checkWellFormed,

   ExpandedLiteralValuePToken,
};
