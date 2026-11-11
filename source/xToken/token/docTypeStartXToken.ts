/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { DocTypeStartPToken } from 'token';

import { ExternalIdX, cloneExternalIdX } from '../common/externalIdX';

const DOCTYPE_START_XTOKEN = 'DOCTYPE_START_XTOKEN';

class DocTypeStartXToken {
   public readonly type: typeof DOCTYPE_START_XTOKEN = DOCTYPE_START_XTOKEN;

   public readonly name: string;

   public readonly externalId: ExternalIdX | undefined;

   public pToken?: DocTypeStartPToken;

   constructor(pToken: DocTypeStartPToken);
   constructor(name: string, externalId: ExternalIdX | undefined);
   constructor(nameOrPToken: string | DocTypeStartPToken, externalId?: ExternalIdX | undefined) {
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

export { DOCTYPE_START_XTOKEN, DocTypeStartXToken };
