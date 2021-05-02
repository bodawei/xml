/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { DocTypeStartPToken } from 'token';
import { strOrBlank } from 'sToken';

import { ExternalIdX } from 'xToken';

const DOCTYPE_START_XTOKEN = 'DOCTYPE_START_XTOKEN';

class DocTypeStartXToken {
   public readonly type: typeof DOCTYPE_START_XTOKEN = DOCTYPE_START_XTOKEN;

   public readonly name: string;

   public readonly externalId: ExternalIdX | undefined;

   public readonly hasInternalSubset: boolean;

   public pToken?: DocTypeStartPToken;

   constructor(pToken: DocTypeStartPToken);
   constructor(name: string, externalId: ExternalIdX | undefined, hasInternalSubset: boolean);
   constructor(
      nameOrPToken: string | DocTypeStartPToken,
      externalId?: ExternalIdX | undefined,
      hasInternalSubset?: boolean,
   ) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.externalId = externalId;
         this.hasInternalSubset = !!hasInternalSubset;
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.externalId = nameOrPToken.externalId
            ? new ExternalIdX(nameOrPToken.externalId)
            : undefined;
         this.hasInternalSubset = !!nameOrPToken.openSubset;
         this.pToken = nameOrPToken;
      }
   }
}

export { DOCTYPE_START_XTOKEN, DocTypeStartXToken };
