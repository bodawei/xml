/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { ContentModelX } from '../common/contentModelX';

const ELEMENT_DECLARATION_XTOKEN = 'ELEMENT_DECLARATION_XTOKEN';

class ElementDeclarationXToken {
   public readonly type: typeof ELEMENT_DECLARATION_XTOKEN = ELEMENT_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly contentSpec: string;

   public readonly contentModel?: ContentModelX;

   public pToken?: ElementDeclarationPToken;

   constructor(pToken: ElementDeclarationPToken);
   constructor(name: string, contentSpec?: string, contentModel?: ContentModelX);
   constructor(
      nameOrPToken: string | ElementDeclarationPToken,
      contentSpec?: string,
      contentModel?: ContentModelX,
   ) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.contentSpec = contentSpec || '';
         this.contentModel = contentModel;
      } else {
         let contentSpec: string = strOrBlank(nameOrPToken.contentSpec);
         let contentModel;

         if (nameOrPToken.contentModel) {
            contentSpec = 'CHILDREN';
            contentModel = new ContentModelX(nameOrPToken.contentModel);
         }

         this.name = strOrBlank(nameOrPToken.name);
         this.contentSpec = contentSpec;
         this.contentModel = contentModel;
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_DECLARATION_XTOKEN, ElementDeclarationXToken };
