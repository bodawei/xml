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

const GENERAL_ENTITY_DECLARATION_PTOKEN = 'GENERAL_ENTITY_DECLARATION_PTOKEN';
const GENERAL_ENTITY_DECLARATION_XTOKEN = 'GENERAL_ENTITY_DECLARATION_XTOKEN';

type ExpandedLiteralValuePToken = Array<TextPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken>;

class GeneralEntityDeclarationXToken {
   public readonly type: string = GENERAL_ENTITY_DECLARATION_XTOKEN;
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
   public readonly type: string = GENERAL_ENTITY_DECLARATION_PTOKEN;
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
      this.type = GENERAL_ENTITY_DECLARATION_PTOKEN;
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
      externalId.makeEntityLocation(pToken.externalId),
      strOrBlank(pToken.nDataName),
      pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: GeneralEntityDeclarationPToken): Array<SToken> {
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
         pToken.nData,
         pToken.nDataSpace,
         pToken.nDataName,
         pToken.nDataNameSpace,
         pToken.close,
         );


// public readonly unassigned?: UnassignedArray;
// public readonly extra?: UnassignedArray;
// public readonly nextPropName?: string;

   return builder.sTokenArray;
}

export {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_XTOKEN,

   GeneralEntityDeclarationXToken,
   GeneralEntityDeclarationPToken,
};
