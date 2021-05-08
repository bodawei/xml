/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { ContentModelX, ContentNameX, isContentNameX } from '../common/contentModelX';

enum ContentSpecType {
   EMPTY = 'EMPTY',
   ANY = 'ANY',
   MIXED = 'MIXED',
   ELEMENT = 'ELEMENT',
}

const ELEMENT_DECLARATION_XTOKEN = 'ELEMENT_DECLARATION_XTOKEN';

function isMixed(contentModel: ContentModelX): boolean {
   const childrenAreAllNames = contentModel.particles.reduce((acc, particle) => {
      return acc && isContentNameX(particle);
   }, true);
   const first: ContentModelX | ContentNameX | undefined =
      contentModel.particles.length > 0 ? contentModel.particles[0] : undefined;
   const firstIsPCData = !!first && isContentNameX(first) && first.name.toUpperCase() === '#PCDATA';

   return childrenAreAllNames && firstIsPCData;
}

function stringToSpecType(
   type: string,
   contentModel: ContentModelX | undefined,
   isMixedModel: boolean,
): ContentSpecType {
   switch (type) {
      case 'ANY':
         return ContentSpecType.ANY;
      case 'EMPTY':
         return ContentSpecType.EMPTY;
      default:
         if (contentModel) {
            return isMixedModel ? ContentSpecType.MIXED : ContentSpecType.ELEMENT;
         }
         return ContentSpecType.ANY;
   }
}

function adjustMixed(
   contentModel: ContentModelX | undefined,
): [boolean, ContentModelX | undefined] {
   if (!contentModel) {
      return [false, undefined];
   }

   let adjusted = contentModel;
   const isMixedModel = isMixed(contentModel);

   if (isMixedModel) {
      const pcData = contentModel.particles[0] as ContentNameX; // We know the first type is a name
      const rest = contentModel.particles.slice(1);
      const newPCData = {
         ...pcData,
         name: '#PCDATA',
      };

      adjusted = {
         ...contentModel,
         particles: [newPCData, ...rest],
      };
   }

   return [isMixedModel, adjusted];
}

class ElementDeclarationXToken {
   public readonly type: typeof ELEMENT_DECLARATION_XTOKEN = ELEMENT_DECLARATION_XTOKEN;

   public readonly name: string;

   public readonly contentSpec: ContentSpecType;

   public readonly contentModel?: ContentModelX;

   public pToken?: ElementDeclarationPToken;

   constructor(pToken: ElementDeclarationPToken);
   constructor(name: string, contentSpec?: ContentSpecType, contentModel?: ContentModelX);
   constructor(
      nameOrPToken: string | ElementDeclarationPToken,
      contentSpec?: ContentSpecType,
      contentModel?: ContentModelX,
   ) {
      if (typeof nameOrPToken === 'string') {
         let specType = contentSpec ?? ContentSpecType.ANY;
         let model = contentModel;

         if (contentModel) {
            const [isMixed, finalContentModel] = adjustMixed(contentModel);

            specType = isMixed ? ContentSpecType.MIXED : ContentSpecType.ELEMENT;
            model = finalContentModel;
         }

         this.name = nameOrPToken;
         this.contentSpec = specType;
         this.contentModel = model;
      } else {
         const ucSpecType = strOrBlank(nameOrPToken.contentSpec);
         const contentModelPreAdjustment = nameOrPToken.contentModel
            ? new ContentModelX(nameOrPToken.contentModel)
            : undefined;
         const [isMixed, finalContentModel] = adjustMixed(contentModelPreAdjustment);
         const contentSpec = stringToSpecType(ucSpecType, finalContentModel, isMixed);

         this.name = strOrBlank(nameOrPToken.name);
         this.contentSpec = contentSpec;
         this.contentModel = finalContentModel;
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_DECLARATION_XTOKEN, ContentSpecType, ElementDeclarationXToken };
