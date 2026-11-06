/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

import { ExternalIdP } from '../common/externalId';
import { UnexpandedMarkupDetails } from '../types';

import { DeclarationStart } from '../../token/bridge/declaration';
import { EntityValuePToken } from 'token';

const GENERAL_ENTITY_DECLARATION_PTOKEN = 'GENERAL_ENTITY_DECLARATION_PTOKEN';

interface GeneralEntityDeclarationProps {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   externalId?: ExternalIdP;
   externalIdSpace?: SToken;
   openQuote?: SToken;
   value?: EntityValuePToken;
   closeQuote?: SToken;
   valueSpace?: SToken;
   nData?: SToken;
   nDataSpace?: SToken;
   nDataName?: SToken;
   nDataNameSpace?: SToken;
   unexpanded?: UnexpandedMarkupDetails | undefined;
   extra?: SToken | false;
   close?: SToken;
}

type GeneralEntityDeclaration = GeneralEntityDeclarationProps & {
   open: SToken;
};

function isNotDeclarationStart(
   token: GeneralEntityDeclarationPToken | GeneralEntityDeclaration | DeclarationStart,
): token is GeneralEntityDeclarationPToken | GeneralEntityDeclaration {
   return (
      'name' in token ||
      'nameSpace' in token ||
      'externalId' in token ||
      'externalIdSpace' in token ||
      'openQuote' in token ||
      'value' in token ||
      'closeQuote' in token ||
      'valueSpace' in token ||
      'nData' in token ||
      'nDataSpace' in token ||
      'nDataName' in token ||
      'nDataNameSpace' in token ||
      'close' in token ||
      'unexpanded' in token ||
      'extra' in token
   );
}

class GeneralEntityDeclarationPToken {
   public readonly type: typeof GENERAL_ENTITY_DECLARATION_PTOKEN = GENERAL_ENTITY_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly declType?: SToken;

   public readonly declTypeSpace?: SToken;

   public readonly name?: SToken;

   public readonly nameSpace?: SToken;

   public readonly externalId?: ExternalIdP;

   public readonly externalIdSpace?: SToken;

   public readonly openQuote?: SToken;

   public readonly value: EntityValuePToken;

   public readonly closeQuote?: SToken;

   public readonly valueSpace?: SToken;

   public readonly nData?: SToken;

   public readonly nDataSpace?: SToken;

   public readonly nDataName?: SToken;

   public readonly nDataNameSpace?: SToken;

   public readonly unexpanded: UnexpandedMarkupDetails | undefined;

   public readonly extra: SToken | false | undefined;

   public readonly close?: SToken;

   constructor(
      props: GeneralEntityDeclarationPToken | GeneralEntityDeclaration | DeclarationStart,
      other: GeneralEntityDeclarationProps = {},
   ) {
      this.open = other.open ?? props.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : props.openSpace;
      this.declType = 'declType' in other ? other.declType : props.declType;
      this.declTypeSpace = 'declTypeSpace' in other ? other.declTypeSpace : props.declTypeSpace;
      this.value = [];

      if (isNotDeclarationStart(props)) {
         this.name = props.name;
         this.nameSpace = props.nameSpace;
         this.externalId = props.externalId;
         this.externalIdSpace = props.externalIdSpace;
         this.openQuote = props.openQuote;
         this.value = props.value ?? this.value;
         this.closeQuote = props.closeQuote;
         this.valueSpace = props.valueSpace;
         this.nData = props.nData;
         this.nDataSpace = props.nDataSpace;
         this.nDataName = props.nDataName;
         this.nDataNameSpace = props.nDataNameSpace;
         this.unexpanded = props.unexpanded;
         this.extra = props.extra;
         this.close = props.close;
      }

      this.name = 'name' in other ? other.name : this.name;
      this.nameSpace = 'nameSpace' in other ? other.nameSpace : this.nameSpace;
      this.externalId = 'externalId' in other ? other.externalId : this.externalId;
      this.externalIdSpace =
         'externalIdSpace' in other ? other.externalIdSpace : this.externalIdSpace;
      this.openQuote = 'openQuote' in other ? other.openQuote : this.openQuote;
      this.value = 'value' in other ? (other.value ? [...other.value] : []) : this.value;
      this.closeQuote = 'closeQuote' in other ? other.closeQuote : this.closeQuote;
      this.valueSpace = 'valueSpace' in other ? other.valueSpace : this.valueSpace;
      this.nData = 'nData' in other ? other.nData : this.nData;
      this.nDataSpace = 'nDataSpace' in other ? other.nDataSpace : this.nDataSpace;
      this.nDataName = 'nDataName' in other ? other.nDataName : this.nDataName;
      this.nDataNameSpace = 'nDataNameSpace' in other ? other.nDataNameSpace : this.nDataNameSpace;
      this.unexpanded = 'unexpanded' in other ? other.unexpanded : this.unexpanded;
      this.extra = 'extra' in other ? other.extra : this.extra;
      this.close = 'close' in other ? other.close : this.close;
   }
}

export {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GeneralEntityDeclarationProps,
   GeneralEntityDeclarationPToken,
};
