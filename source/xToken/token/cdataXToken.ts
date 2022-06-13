/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { CdataPToken } from 'token';

const CDATA_SECTION_XTOKEN = 'CDATA_SECTION_XTOKEN';

class CdataXToken {
   public readonly type: typeof CDATA_SECTION_XTOKEN = CDATA_SECTION_XTOKEN;

   public readonly text: string;

   public pToken?: CdataPToken;

   constructor(source: string | CdataPToken) {
      if (typeof source === 'string') {
         this.text = source;
      } else {
         this.text = strOrBlank(source.text);
         this.pToken = source;
      }
   }
}

export { CDATA_SECTION_XTOKEN, CdataXToken };
