/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { TextDeclarationPToken } from 'pToken';

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
      // An empty encoding name must fall back to the default too, so this must stay `||`.
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
