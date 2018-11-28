/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { textOrBlank } from './common/misc';

const GENERAL_ENTITY_REFERENCE_PTOKEN = 'GENERAL_ENTITY_REFERENCE_PTOKEN';
const GENERAL_ENTITY_REFERENCE_XTOKEN = 'GENERAL_ENTITY_REFERENCE_XTOKEN';
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

class GeneralEntityReferenceXToken {
   public readonly type: typeof GENERAL_ENTITY_REFERENCE_XTOKEN = GENERAL_ENTITY_REFERENCE_XTOKEN;
   public readonly name: string;
   public readonly pToken?: GeneralEntityReferencePToken;

   constructor(name: string, pToken?: GeneralEntityReferencePToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

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

   toXToken(): GeneralEntityReferenceXToken {
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
   const entityName = textOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.REFERENCE_NO_NAME);

   ec.setPos(pToken.nameSpace);
   ec.check(pToken.nameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: GeneralEntityReferencePToken) {
   return new GeneralEntityReferenceXToken(textOrBlank(pToken.name), pToken);
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
   GENERAL_ENTITY_REFERENCE_XTOKEN,
   GeneralEntityReferencePToken,
   GeneralEntityReferenceXToken,

   parseGeneralEntityReference,
};
