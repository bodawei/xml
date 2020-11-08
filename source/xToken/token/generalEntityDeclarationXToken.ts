/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ExternalIdX } from 'xToken';

import { ExntityValueX, makeEntityValueX } from '../util/makeEntityValueX';

// ick
import { GeneralEntityDeclarationPToken } from 'token';

const GENERAL_ENTITY_DECLARATION_XTOKEN = 'GENERAL_ENTITY_DECLARATION_XTOKEN';

class GeneralEntityDeclarationXToken {
   public readonly type: typeof GENERAL_ENTITY_DECLARATION_XTOKEN = GENERAL_ENTITY_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly externalId: ExternalIdX | undefined;

   public readonly notationDataName: string;

   public readonly isParameter: boolean;

   public readonly value: ExntityValueX;

   public pToken?: GeneralEntityDeclarationPToken;

   constructor(pToken: GeneralEntityDeclarationPToken);
   constructor(
      name: string,
      value?: ExntityValueX,
      externalId?: ExternalIdX,
      notationDataName?: string,
   );
   constructor(
      nameOrPToken: string | GeneralEntityDeclarationPToken,
      value: ExntityValueX = [],
      externalId?: ExternalIdX,
      notationDataName?: string,
   ) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.value = [...value];
         this.externalId = externalId;
         this.notationDataName = notationDataName || '';
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.value = makeEntityValueX(nameOrPToken.value);
         this.externalId = nameOrPToken.externalId && new ExternalIdX(nameOrPToken.externalId);
         this.notationDataName = strOrBlank(nameOrPToken.nDataName);
         this.pToken = nameOrPToken;
      }

      this.isParameter = false;
   }
}

export { GENERAL_ENTITY_DECLARATION_XTOKEN, GeneralEntityDeclarationXToken };
