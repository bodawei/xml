/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from '../../pToken/token/elementDeclaration';
import { strOrBlank } from 'sToken';

// ick
import nameList, { XNameList } from '../../token/contentspec/nameList';

const ELEMENT_DECLARATION_XTOKEN = 'ELEMENT_DECLARATION_XTOKEN';

class ElementDeclarationXToken {
   public readonly type: typeof ELEMENT_DECLARATION_XTOKEN = ELEMENT_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly contentSpecType: string;

   public readonly children?: XNameList;

   public pToken?: ElementDeclarationPToken;

   constructor(pToken: ElementDeclarationPToken);
   constructor(name: string, contentSpecType?: string, children?: XNameList);
   constructor(
      nameOrPToken: string | ElementDeclarationPToken,
      contentSpecType?: string,
      children?: XNameList,
   ) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.contentSpecType = contentSpecType || '';
         this.children = children;
      } else {
         let contentSpec: string = strOrBlank(nameOrPToken.contentSpec);
         let children;

         if (nameOrPToken.children) {
            contentSpec = 'CHILDREN';
            children = nameList.makeXTokenCompatible(nameOrPToken.children);
         }

         this.name = strOrBlank(nameOrPToken.name);
         this.contentSpecType = contentSpec;
         this.children = children;
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_DECLARATION_XTOKEN, ElementDeclarationXToken };
