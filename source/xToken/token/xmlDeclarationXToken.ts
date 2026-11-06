/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'basic';

const XMLDECL_XTOKEN = 'XMLDECL_XTOKEN';

type XmlVersion = 1.0 | 1.1;
const DEFAULT_ENCODING = 'utf-8';

class XmlDeclarationXToken {
   public readonly type: typeof XMLDECL_XTOKEN = XMLDECL_XTOKEN;

   public readonly version: XmlVersion;

   public readonly encoding: string;

   public readonly standalone: boolean;

   public pToken?: XmlDeclarationPToken;

   constructor(pToken: XmlDeclarationPToken);
   constructor(version: XmlVersion, encoding?: string, standalone?: boolean);
   constructor(
      versionOrPToken: XmlVersion | XmlDeclarationPToken,
      encoding?: string,
      standalone?: boolean,
   ) {
      this.version = 1.0;
      // An empty encoding name must fall back to the default too, so this must stay `||`.
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      this.encoding = encoding || DEFAULT_ENCODING;
      this.standalone = standalone ?? false;

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
            case 'standalone':
               this.standalone = value.toLowerCase() === 'yes';
               break;
         }
      }
   }
}

export { XMLDECL_XTOKEN, XmlDeclarationXToken };
