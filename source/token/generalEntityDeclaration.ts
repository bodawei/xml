/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { ErrorCollector } from 'error';
import { strOrBlank, SToken, STokenArrayBuilder } from 'sToken';

import { DeclarationStart } from './bridge/declaration';
import { UnassignedArray } from './common/unassigned';
import { ExternalId, makeEntityLocation, getSTokens } from './common/externalId';
import literal, { LiteralValuePToken } from './common/literal';
import { TextPToken } from './text';
import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from './marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from './parameterEntityReference';
import { assignUnassigned, checkWellFormed } from './common/entity';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const GENERAL_ENTITY_DECLARATION_PTOKEN = 'GENERAL_ENTITY_DECLARATION_PTOKEN';
const GENERAL_ENTITY_DECLARATION_XTOKEN = 'GENERAL_ENTITY_DECLARATION_XTOKEN';

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;  // @@ why are these PTokens?  And where did the text come from, and has it been scanned for chars?

class GeneralEntityDeclarationXToken {
   public readonly type: typeof GENERAL_ENTITY_DECLARATION_XTOKEN = GENERAL_ENTITY_DECLARATION_XTOKEN;
   public readonly name: string;
   public readonly externalLoc: EntityLocation | void;
   public readonly notationDataName: string | void;
   public readonly isParameter: boolean;
   public readonly value: ExpandedLiteralValuePToken;
   public pToken?: GeneralEntityDeclarationPToken;

   constructor(name: string, value: ExpandedLiteralValuePToken, externalLoc?: EntityLocation | void, notationDataName?: string | void, pToken?: GeneralEntityDeclarationPToken) {
      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
      this.pToken = pToken;
   }
}

class GeneralEntityDeclarationPToken {
   public readonly type: typeof GENERAL_ENTITY_DECLARATION_PTOKEN = GENERAL_ENTITY_DECLARATION_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly declType?: SToken;
   public readonly declTypeSpace?: SToken;
   public readonly parameter?: SToken;
   public readonly parameterSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly externalId?: ExternalId;
   public readonly externalIdSpace?: SToken;
   public readonly value: LiteralValuePToken;
   public readonly entityValueSpace?: SToken;
   public readonly nData?: SToken;
   public readonly nDataSpace?: SToken;
   public readonly nDataName?: SToken;
   public readonly nDataNameSpace?: SToken;
   public readonly close?: SToken;
   public readonly peRefPlus: UnassignedArray;
   public readonly unassigned?: UnassignedArray;
   public readonly extra?: UnassignedArray;
   public readonly nextPropName?: string;

   constructor(props: Object | DeclarationStart) {
      Object.assign(this, props);

      this.open = (props as any).open;
      this.value = (props as any).value || [];
      this.type = GENERAL_ENTITY_DECLARATION_PTOKEN;

      if (props) {
         this.peRefPlus = (props as any).peRefPlus || []
      } else {
         this.peRefPlus = [];
      }
   }

   assignUnassigned() {
      assignUnassigned(this);
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData) {
      checkWellFormed(this, ec, entityMetaData);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 pTokenToXToken() makes either a general or parmaeter entity token based
 on the PToken value.

 NOTE: The EntityValue is an array of PTokens. They are not XTokenized,
 as every consumer will need to further process them.
\**********************************************************************/

function pTokenToXToken(pToken: GeneralEntityDeclarationPToken) {
   return new GeneralEntityDeclarationXToken(strOrBlank(pToken.name),
      pToken.value as any,
      makeEntityLocation(pToken.externalId),
      strOrBlank(pToken.nDataName),
      pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: GeneralEntityDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const literalSTokens = literal.getSTokens(pToken);
   const externalIdSTokens = getSTokens(pToken.externalId);

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.parameterSpace,
      pToken.name,
      pToken.nameSpace,
      externalIdSTokens,
      literalSTokens,
      pToken.externalIdSpace,
      pToken.entityValueSpace,
      pToken.close,
      );

      // Where to unassigned go?

   return builder.sTokenArray;
}

export {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_XTOKEN,

   GeneralEntityDeclarationXToken,
   GeneralEntityDeclarationPToken,
};
