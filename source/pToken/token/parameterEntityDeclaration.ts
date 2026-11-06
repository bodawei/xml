/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

import { ExternalIdP } from '../common/externalId';
import { UnexpandedMarkupDetails } from '../types';

import { DeclarationStart } from '../../token/bridge/declaration';
import { EntityValuePToken } from 'token';

const PARAMETER_ENTITY_DECLARATION_PTOKEN = 'PARAMETER_ENTITY_DECLARATION_PTOKEN';

interface ParameterEntityDeclarationProps {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   parameter?: SToken;
   parameterSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   externalId?: ExternalIdP;
   externalIdSpace?: SToken;
   openQuote?: SToken;
   value?: EntityValuePToken;
   closeQuote?: SToken;
   valueSpace?: SToken;
   unexpanded?: UnexpandedMarkupDetails | undefined;
   extra?: SToken | false;
   close?: SToken;
}

type ParameterEntityDeclaration = ParameterEntityDeclarationProps & {
   open: SToken;
};

function isNotDeclarationStart(
   token: ParameterEntityDeclarationPToken | ParameterEntityDeclaration | DeclarationStart,
): token is ParameterEntityDeclarationPToken | ParameterEntityDeclaration {
   return (
      'parameter' in token ||
      'parameterSpace' in token ||
      'name' in token ||
      'nameSpace' in token ||
      'externalId' in token ||
      'externalIdSpace' in token ||
      'openQuote' in token ||
      'value' in token ||
      'closeQuote' in token ||
      'valueSpace' in token ||
      'close' in token ||
      'unexpanded' in token ||
      'extra' in token
   );
}

class ParameterEntityDeclarationPToken {
   public readonly type: typeof PARAMETER_ENTITY_DECLARATION_PTOKEN = PARAMETER_ENTITY_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly declType?: SToken;

   public readonly declTypeSpace?: SToken;

   public readonly parameter?: SToken;

   public readonly parameterSpace?: SToken;

   public readonly name?: SToken;

   public readonly nameSpace?: SToken;

   public readonly externalId?: ExternalIdP;

   public readonly externalIdSpace?: SToken;

   public readonly openQuote?: SToken;

   public readonly value: EntityValuePToken;

   public readonly closeQuote?: SToken;

   public readonly valueSpace?: SToken;

   public readonly unexpanded: UnexpandedMarkupDetails | undefined;

   public readonly extra: SToken | false | undefined;

   public readonly close?: SToken;

   constructor(
      props: ParameterEntityDeclarationPToken | ParameterEntityDeclaration | DeclarationStart,
      other: ParameterEntityDeclarationProps = {},
   ) {
      this.open = other.open ?? props.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : props.openSpace;
      this.declType = 'declType' in other ? other.declType : props.declType;
      this.declTypeSpace = 'declTypeSpace' in other ? other.declTypeSpace : props.declTypeSpace;
      this.value = [];

      if (isNotDeclarationStart(props)) {
         this.parameter = props.parameter;
         this.parameterSpace = props.parameterSpace;
         this.name = props.name;
         this.nameSpace = props.nameSpace;
         this.externalId = props.externalId;
         this.externalIdSpace = props.externalIdSpace;
         this.openQuote = props.openQuote;
         this.value = props.value ?? this.value;
         this.closeQuote = props.closeQuote;
         this.valueSpace = props.valueSpace;
         this.unexpanded = props.unexpanded;
         this.extra = props.extra;
         this.close = props.close;
      }

      this.parameter = 'parameter' in other ? other.parameter : this.parameter;
      this.parameterSpace = 'parameterSpace' in other ? other.parameterSpace : this.parameterSpace;
      this.name = 'name' in other ? other.name : this.name;
      this.nameSpace = 'nameSpace' in other ? other.nameSpace : this.nameSpace;
      this.externalId = 'externalId' in other ? other.externalId : this.externalId;
      this.externalIdSpace =
         'externalIdSpace' in other ? other.externalIdSpace : this.externalIdSpace;
      this.openQuote = 'openQuote' in other ? other.openQuote : this.openQuote;
      this.value = 'value' in other ? (other.value ? [...other.value] : []) : this.value;
      this.closeQuote = 'closeQuote' in other ? other.closeQuote : this.closeQuote;
      this.valueSpace = 'valueSpace' in other ? other.valueSpace : this.valueSpace;
      this.unexpanded = 'unexpanded' in other ? other.unexpanded : this.unexpanded;
      this.extra = 'extra' in other ? other.extra : this.extra;
      this.close = 'close' in other ? other.close : this.close;
   }
}

export {
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   ParameterEntityDeclarationProps,
   ParameterEntityDeclarationPToken,
};
