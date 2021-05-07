/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { DeclarationPToken } from 'token';

const UNKNOWNDECL_XTOKEN = 'UNKNOWNDECL_XTOKEN';

class UnknownDeclarationXToken {
   public readonly type = UNKNOWNDECL_XTOKEN;

   public pToken?: DeclarationPToken;

   constructor(pToken?: DeclarationPToken) {
      this.pToken = pToken;
   }
}

export { UNKNOWNDECL_XTOKEN, UnknownDeclarationXToken };
