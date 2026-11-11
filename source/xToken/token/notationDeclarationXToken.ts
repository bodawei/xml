/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { NotationDeclarationPToken } from 'pToken';

import { ExternalIdX, cloneExternalIdX } from '../common/externalIdX';

const NOTATION_DECLARATION_XTOKEN = 'NOTATION_DECLARATION_XTOKEN';

class NotationDeclarationXToken {
   public readonly type: typeof NOTATION_DECLARATION_XTOKEN = NOTATION_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly externalId?: ExternalIdX;

   public pToken?: NotationDeclarationPToken;

   constructor(pToken: NotationDeclarationPToken);
   constructor(name: string, externalId?: ExternalIdX);
   constructor(nameOrPToken: string | NotationDeclarationPToken, externalId?: ExternalIdX) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.externalId = cloneExternalIdX(externalId);
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.externalId = nameOrPToken.externalId && new ExternalIdX(nameOrPToken.externalId);
         this.pToken = nameOrPToken;
      }
   }
}

export { NOTATION_DECLARATION_XTOKEN, NotationDeclarationXToken };
