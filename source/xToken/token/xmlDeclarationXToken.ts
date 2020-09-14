/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

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
   constructor(
      version: XmlVersion,
      encoding?: string,
      standalone?: boolean,
      pToken?: XmlDeclarationPToken,
   );
   constructor(
      versionOrPToken: XmlVersion | XmlDeclarationPToken,
      encoding?: string,
      standalone?: boolean,
      pToken?: XmlDeclarationPToken,
   ) {
      this.version = 1.0;
      this.encoding = encoding || DEFAULT_ENCODING;
      this.standalone = standalone || false;

      if (typeof versionOrPToken === 'number') {
         this.version = versionOrPToken;
         this.pToken = pToken;
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
