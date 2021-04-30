/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { DocTypeEndPToken } from 'token';

const DOCTYPE_END_XTOKEN = 'DOCTYPE_END_XTOKEN';

class DocTypeEndXToken {
   public readonly type: typeof DOCTYPE_END_XTOKEN = DOCTYPE_END_XTOKEN;

   public pToken?: DocTypeEndPToken;

   constructor(pToken?: DocTypeEndPToken) {
      this.pToken = pToken;
   }
}

export { DOCTYPE_END_XTOKEN, DocTypeEndXToken };
