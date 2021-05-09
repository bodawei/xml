/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { TextDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

const DEFAULT_ENCODING = 'utf-8';
const TEXTDECL_XTOKEN = 'TEXTDECL_XTOKEN';

type XmlVersion = 1.0 | 1.1;

class TextDeclarationXToken {
   public readonly type: typeof TEXTDECL_XTOKEN = TEXTDECL_XTOKEN;

   public readonly version: XmlVersion;

   public readonly encoding: string;

   public pToken?: TextDeclarationPToken;

   constructor(pToken: TextDeclarationPToken);
   constructor(version: XmlVersion, encoding?: string, pToken?: TextDeclarationPToken);
   constructor(versionOrPToken: XmlVersion | TextDeclarationPToken, encoding?: string) {
      this.version = 1.0;
      this.encoding = encoding || DEFAULT_ENCODING;

      if (typeof versionOrPToken === 'number') {
         this.version = versionOrPToken;
         return;
      }

      this.pToken = versionOrPToken;

      for (const param of versionOrPToken.fields) {
         const name = strOrBlank(param.name);
         const value = strOrBlank(param.value);

         switch (name.toLowerCase()) {
            case 'version':
               this.version = value === '1.1' ? 1.1 : 1.0;
               break;
            case 'encoding':
               this.encoding = value;
               break;
         }
      }
   }
}

export { TEXTDECL_XTOKEN, TextDeclarationXToken };
