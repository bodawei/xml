/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ExternalIdXToken } from '../common/externalIdXToken';

const NOTATION_DECLARATION_XTOKEN = 'NOTATION_DECLARATION_XTOKEN';

class NotationDeclarationXToken {
   public readonly type: typeof NOTATION_DECLARATION_XTOKEN = NOTATION_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly externalId?: ExternalIdXToken;

   public pToken?: NotationDeclarationPToken;

   constructor(pToken: NotationDeclarationPToken);
   constructor(name: string, externalId?: ExternalIdXToken);
   constructor(nameOrPToken: string | NotationDeclarationPToken, externalId?: ExternalIdXToken) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.externalId = externalId;
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.externalId = nameOrPToken.externalId
            ? new ExternalIdXToken(nameOrPToken.externalId)
            : undefined;
         this.pToken = nameOrPToken;
      }
   }
}

export { NOTATION_DECLARATION_XTOKEN, NotationDeclarationXToken };
