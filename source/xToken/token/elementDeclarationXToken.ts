/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken, strOrBlank } from 'basic';
import { ElementDeclarationPToken } from 'pToken';

import { ContentModelX, isContentNameX, cloneContentModelX } from '../common/contentModelX';

enum ContentSpecType {
   EMPTY = 'EMPTY',
   ANY = 'ANY',
   MIXED = 'MIXED',
   ELEMENT = 'ELEMENT',
}

const ELEMENT_DECLARATION_XTOKEN = 'ELEMENT_DECLARATION_XTOKEN';

function isMixed(contentModel: ContentModelX | undefined): boolean {
   let childrenAreAllNames = true;
   let hasPCData = false;

   if (!contentModel) {
      return false;
   }

   for (const particle of contentModel.particles) {
      childrenAreAllNames = childrenAreAllNames && isContentNameX(particle);
      hasPCData =
         hasPCData || (isContentNameX(particle) && particle.name.toUpperCase() === '#PCDATA');
   }

   return childrenAreAllNames && hasPCData;
}

function deriveSpecType(
   contentSpec: SToken | undefined,
   contentModel: ContentModelX | undefined,
   isMixedModel: boolean,
): ContentSpecType {
   const ucSpecType = strOrBlank(contentSpec);

   switch (ucSpecType) {
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
   isMixedModel: boolean,
): ContentModelX | undefined {
   if (!isMixedModel || !contentModel) {
      return contentModel;
   }

   const newParticles = [];
   let seenPCData = false;

   for (const particle of contentModel.particles) {
      if (isContentNameX(particle) && particle.name.toUpperCase() === '#PCDATA') {
         if (!seenPCData) {
            newParticles.unshift({
               ...particle,
               name: '#PCDATA',
            });
            seenPCData = true;
         }
      } else {
         newParticles.push(particle);
      }
   }

   return {
      ...contentModel,
      particles: newParticles,
   };
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
            const isMixedModel = isMixed(contentModel);

            specType = isMixedModel ? ContentSpecType.MIXED : ContentSpecType.ELEMENT;
            model = isMixedModel ? contentModel : adjustMixed(contentModel, isMixedModel);
         }

         this.name = nameOrPToken;
         this.contentSpec = specType;
         this.contentModel = cloneContentModelX(model);
      } else {
         const rawContentModel = nameOrPToken.contentModel
            ? new ContentModelX(nameOrPToken.contentModel)
            : undefined;
         const isMixedModel = isMixed(rawContentModel);
         const contentModel = isMixedModel
            ? adjustMixed(rawContentModel, isMixedModel)
            : rawContentModel;

         this.name = strOrBlank(nameOrPToken.name);
         this.contentSpec = deriveSpecType(nameOrPToken.contentSpec, contentModel, isMixedModel);
         this.contentModel = contentModel;
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_DECLARATION_XTOKEN, ContentSpecType, ElementDeclarationXToken };
