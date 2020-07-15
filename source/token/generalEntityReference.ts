/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';
import { checkName } from './common/misc';

const GENERAL_ENTITY_REFERENCE_PTOKEN = 'GENERAL_ENTITY_REFERENCE_PTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: GeneralEntityReferencePToken | void) => void;

type GeneralReference = {
   open: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
};

/**********************************************************************\
 This has routines for processing general entity reference.
\**********************************************************************/

class GeneralEntityReferencePToken {
   public readonly type: typeof GENERAL_ENTITY_REFERENCE_PTOKEN = GENERAL_ENTITY_REFERENCE_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly close?: SToken;

   constructor(param: GeneralEntityReferencePToken | GeneralReference) {
      Object.assign(this, param);
      this.open = param.open;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
      checkWellFormed(this, ec, entityMetaData);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parseGeneralEntityReference() extracts a parameter entity reference.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.1.0
      [68] EntityRef ::= '&' Name ';'
   Lax
      [68] EntityRef ::= '&' S? Name? S? ';'?
\**********************************************************************/

function parseGeneralEntityReference(source: STokenSource, open: SToken, deliverPToken: DeliverPToken) {
   const props: GeneralReference = {
      open,
   };

   source.extractToObjectNoParams('space', props, 'openSpace');
   source.extractToObject('word', [ ';' ], props, 'name');
   source.extractToObjectNoParams('space', props, 'nameSpace');
   source.extract('match', ';', (sToken) => {
      props.close = sToken;
      deliverPToken(new GeneralEntityReferencePToken(props));
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: GeneralEntityReferencePToken, ec: ErrorCollector, entityMetaData: EntityMetaData): void {
   const entityName = strOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.REFERENCE_NO_NAME);

   if (pToken.name) {
      checkName(pToken.name, ec, entityMetaData, WFEID.REFERENCE_NAME_INVALID);
   }

   ec.setPos(pToken.nameSpace);
   ec.check(pToken.nameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: GeneralEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.name,
      pToken.nameSpace,
      pToken.close);

   return builder.sTokenArray;
}

export {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityReferencePToken,

   parseGeneralEntityReference,
};
