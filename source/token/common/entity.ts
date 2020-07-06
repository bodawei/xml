/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import {  EntityMetaData } from 'basic';
import { WellFormedError, XmlWarning, ErrorCollector } from 'error';
import { strOrBlank } from 'sToken';

import unassigned, { UnassignedType } from '../common/unassigned';
import misc from '../common/misc';
import {  checkExternalIdWellFormed } from '../common/externalId';
import literal from '../common/literal';
import { TextPToken } from '../text';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';
import { GeneralEntityDeclarationPToken } from '../generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../parameterEntityDeclaration';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;

/**********************************************************************\
 checkWellFormed() does normal validation.
\**********************************************************************/

function checkWellFormed(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken) {
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
   checkWellFormed,

   ExpandedLiteralValuePToken,
};
