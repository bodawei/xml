/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { CdataPToken } from 'token';

const CDATA_XTOKEN = 'CDATA_XTOKEN';

class CdataXToken {
   public readonly type: typeof CDATA_XTOKEN = CDATA_XTOKEN;

   public readonly text: string;

   public readonly pToken?: CdataPToken;

   constructor(source: string | CdataPToken) {
      if (typeof source === 'string') {
         this.text = source;
      } else {
         this.text = strOrBlank(source.text);
         this.pToken = source;
      }
   }
}

export { CDATA_XTOKEN, CdataXToken };
