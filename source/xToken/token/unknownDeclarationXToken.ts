/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { DeclarationPToken } from 'token';

const UNKNOWN_DECLARATION_XTOKEN = 'UNKNOWN_DECLARATION_XTOKEN';

class UnknownDeclarationXToken {
   public readonly type = UNKNOWN_DECLARATION_XTOKEN;

   public pToken?: DeclarationPToken;

   constructor(pToken?: DeclarationPToken) {
      this.pToken = pToken;
   }
}

export { UNKNOWN_DECLARATION_XTOKEN, UnknownDeclarationXToken };
