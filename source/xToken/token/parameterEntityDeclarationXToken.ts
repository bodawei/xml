/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ParameterEntityDeclarationPToken } from 'pToken';
import { ExternalIdX } from 'xToken';

import { ExntityValueX, makeEntityValueX } from '../common/makeEntityValueX';

const PARAMETER_ENTITY_DECLARATION_XTOKEN = 'PARAMETER_ENTITY_DECLARATION_XTOKEN';

class ParameterEntityDeclarationXToken {
   public readonly type: typeof PARAMETER_ENTITY_DECLARATION_XTOKEN = PARAMETER_ENTITY_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly externalId: ExternalIdX | undefined;

   public readonly isParameter: boolean;

   public readonly value: ExntityValueX;

   public pToken?: ParameterEntityDeclarationPToken;

   constructor(pToken: ParameterEntityDeclarationPToken);
   constructor(
      name: string,
      value?: ExntityValueX,
      externalId?: ExternalIdX,
      notationDataName?: string,
   );
   constructor(
      nameOrPToken: string | ParameterEntityDeclarationPToken,
      value: ExntityValueX = [],
      externalId?: ExternalIdX,
   ) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.value = [...value];
         this.externalId = externalId;
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.value = makeEntityValueX(nameOrPToken.value);
         this.externalId = nameOrPToken.externalId && new ExternalIdX(nameOrPToken.externalId);
         this.pToken = nameOrPToken;
      }

      this.isParameter = true;
   }
}

export { PARAMETER_ENTITY_DECLARATION_XTOKEN, ParameterEntityDeclarationXToken };
