/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';
import { checkName } from './common/misc';

const PARAMETER_ENTITY_REFERENCE_PTOKEN = 'PARAMETER_ENTITY_REFERENCE_PTOKEN';
const PARAMETER_ENTITY_REFERENCE_XTOKEN = 'PARAMETER_ENTITY_REFERENCE_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: ParameterEntityReferencePToken | void) => void;

type ParamReference = {
   open: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
};

/**********************************************************************\
 Provides routines for processing parameter entity reference.
\**********************************************************************/

class ParameterEntityReferenceXToken {
   public readonly type: typeof PARAMETER_ENTITY_REFERENCE_XTOKEN = PARAMETER_ENTITY_REFERENCE_XTOKEN;
   public readonly name: string;
   public readonly pToken?: ParameterEntityReferencePToken;

   constructor(name: string, pToken?: ParameterEntityReferencePToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

class ParameterEntityReferencePToken {
   public readonly type: typeof PARAMETER_ENTITY_REFERENCE_PTOKEN = PARAMETER_ENTITY_REFERENCE_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly close?: SToken;

   constructor(param: ParameterEntityReferencePToken | ParamReference) {
      Object.assign(this, param);
      this.open = param.open;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
      checkWellFormed(this, ec, entityMetaData);
   }

   toXToken(): ParameterEntityReferenceXToken {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parseParameterEntityReference() extracts a parameter entity reference.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.1.0
      [69] PEReference ::= '%' Name ';'
   Lax
      [69] PEReference ::= '%' S? Name? S? ';'?
\**********************************************************************/

function parseParameterEntityReference(source: STokenSource, deliverPToken: DeliverPToken) {

   source.extract('match', '%', (result) => {
      if (!result) {
         deliverPToken(undefined);
         return;
      }

      const props: ParamReference = {
         open: result,
      };

      source.extractToObjectNoParams('space', props, 'openSpace');
      source.extractToObject('word', [ ';' ], props, 'name');
      source.extractToObjectNoParams('space', props, 'nameSpace');
      source.extract('match', ';', (sToken) => {
         props.close = sToken;
         deliverPToken(new ParameterEntityReferencePToken(props));
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ParameterEntityReferencePToken, ec: ErrorCollector, entityMetaData: EntityMetaData): void {
   const entityName = strOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.PEREF_XTRA_SPACE, [ entityName ]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.PEREF_NO_NAME);

   if (pToken.name) {
      checkName(pToken.name, ec, entityMetaData, WFEID.PEREF_NAME_INVALID);
   }

   ec.setPos(pToken.nameSpace);
   ec.check(pToken.nameSpace, WFEID.PEREF_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PEREF_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ParameterEntityReferencePToken) {
   return new ParameterEntityReferenceXToken(strOrBlank(pToken.name), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: ParameterEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.name,
      pToken.nameSpace,
      pToken.close);

   return builder.sTokenArray;
}

export {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_XTOKEN,
   ParameterEntityReferencePToken,
   ParameterEntityReferenceXToken,

   parseParameterEntityReference,
};
