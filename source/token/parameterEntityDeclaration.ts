/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError, XmlWarning, ErrorCollector } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

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
import { assignUnassigned, checkWellFormed } from './common/entity';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const PARAMETER_ENTITY_DECLARATION_PTOKEN = 'PARAMETER_ENTITY_DECLARATION_PTOKEN';
const PARAMETER_ENTITY_DECLARATION_XTOKEN = 'PARAMETER_ENTITY_DECLARATION_XTOKEN';

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;  // @@ why are these PTokens?  And where did the text come from, and has it been scanned for chars?

class ParameterEntityDeclarationXToken {
   public readonly type: string = PARAMETER_ENTITY_DECLARATION_XTOKEN;
   public readonly name: string;
   public readonly isParameter: boolean;
   public readonly externalLoc: EntityLocation | void;
   public readonly value: ExpandedLiteralValuePToken;
   public pToken?: ParameterEntityDeclarationPToken;

   constructor(name: string, value: ExpandedLiteralValuePToken, externalLoc?: EntityLocation | void, pToken?: ParameterEntityDeclarationPToken) {
      this.name = name;
      this.isParameter = true;
      this.value = value;
      this.externalLoc = externalLoc;
      this.pToken = pToken;
   }
}

class ParameterEntityDeclarationPToken {
   public readonly type: string = PARAMETER_ENTITY_DECLARATION_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly declType?: SToken;
   public readonly declTypeSpace?: SToken;
   public readonly parameter?: SToken;
   public readonly parameterSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly externalId?: ExternalId;
   public readonly value: LiteralValuePToken;
   public readonly entityValueSpace?: SToken;
   public readonly externalIdSpace?: SToken;
   public readonly close?: SToken;
   public readonly unassigned?: UnassignedArray;
   public readonly extra?: UnassignedArray;
   public readonly nextPropName?: string;

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

function pTokenToXToken(pToken: ParameterEntityDeclarationPToken) {
   return new ParameterEntityDeclarationXToken(strOrBlank(pToken.name),
   pToken.value as any,
   externalId.makeEntityLocation(pToken.externalId),
   pToken as any);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: ParameterEntityDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.parameter,
      pToken.parameterSpace,
      pToken.name,
      pToken.nameSpace);

   // results.pushSTokens.apply(results, literal.getSTokens(this as any)); // eslint-disable-line prefer-spread // typeHack
   // results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread

      builder.add(pToken.externalIdSpace,
         pToken.entityValueSpace,
         pToken.close,
         );


// public readonly unassigned?: UnassignedArray;
// public readonly extra?: UnassignedArray;
// public readonly nextPropName?: string;

   return builder.sTokenArray;
}

export {
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_XTOKEN,

   ParameterEntityDeclarationXToken,
   ParameterEntityDeclarationPToken,
};
