/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { AttListDeclarationXToken } from 'xToken';
import { ElementDeclarationXToken, isContentNameX, ContentSpecType, CpRepeat, CpType, ContentModelX, ContentNameX } from 'xToken';

const ATTR_TYPES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];
const DEFAULT_TYPES = [ '#FIXED', '#REQUIRED', '#IMPLIED' ];

/**********************************************************************\
 A simple stream that forces malformed XTokens to be correct.

 The basic PTokenStream and PToXTokenStream will (deliberately) allow
 one to construct invalid tokens. For example:
   <!ATTLIST myElement
      attr1 BOGUS #REQUIRED>
 will produce an XToken with a type of "BOGUS" if one has set the
 streams up in a "lax" mode (in strict mode, the first error
 encountered ends the stream so this will never get produced).
\**********************************************************************/

class FixingStream extends Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(token: any, encoding: string, callback: () => void) {
      if (token instanceof AttListDeclarationXToken) {
         adjustAttListDeclaration(token);
      } else if (token instanceof ElementDeclarationXToken) {
         token = adjustElementDeclaration(token);
      }

      this.push(token);

      callback();
   }

}

function adjustAttListDeclaration(token: any) {
   for (let index = 0; index < token.attDefs.length; index++) {
      const attDef = token.attDefs[index];
      const capType = (attDef.type || '').toLocaleUpperCase();
      const capDefType = attDef.defaultType.toLocaleUpperCase();

      if (capType !== attDef.type) {
         attDef.type = capType;
      }

      if (ATTR_TYPES.indexOf(capType) === -1) {
         attDef.type = 'CDATA';
      }

      if (capDefType !== attDef.defaultType) {
         attDef.defaultType = capDefType;
      }

      if (capDefType !== '' && DEFAULT_TYPES.indexOf(capDefType) === -1) {
         attDef.defaultType = '#IMPLIED';
      }
   }
}

/*
 * Change the ELEMENT declaration token so that it is completely valid.
 *  - If content spec type is unknown make it ANY or CHILDREN
 *  - If content spec type is known, but the wrong case, capitalize.
 *  - if content spec type is ANY or EMPTY, make sure there are no children.
 *  - Change any #PCDATA in the wrong case into all caps
 *  - If there are any #PCDATA in the entire children, move to the front
 *  - If this is Mixed (first item is #PCDATA) flatten any hierarchical items,
 *    make sure it is a CHOICE list, and the repeat is correct.
 */
const ALLOWED_CONTENT_SPEC_TYPES = [ 'ANY', 'EMPTY', 'CHILDREN' ];

function adjustElementDeclaration(token: ElementDeclarationXToken): ElementDeclarationXToken {
   const contentSpec = token.contentSpec || '';
   const capContentSpec = contentSpec.toLocaleUpperCase();
   let newToken = token;

   // should fix all the names somehow

   // note: A bunch of this is not needed any longer.  
   if (ALLOWED_CONTENT_SPEC_TYPES.indexOf(capContentSpec) === -1) {
      const newContentSpec = token.contentModel ? ContentSpecType.CHILDREN : ContentSpecType.ANY;
      newToken = new ElementDeclarationXToken(token.name, newContentSpec, token.contentModel);
   } else if (contentSpec !== capContentSpec) {
      let specType: ContentSpecType;

      switch (capContentSpec) {
         case 'CHILDREN':
            specType = ContentSpecType.CHILDREN;
            break;
         default:
         case 'ANY':
            specType = ContentSpecType.ANY;
            break;
         case 'EMPTY':
            specType = ContentSpecType.EMPTY;
            break;
      }

      newToken = new ElementDeclarationXToken(token.name, specType, token.contentModel);
   }

   if (newToken.contentSpec === 'ANY' || token.contentSpec === 'EMPTY') {
      newToken = new ElementDeclarationXToken(newToken.name, newToken.contentSpec, undefined);
   }

   if (newToken.contentModel) {
      const first = putPCDataFirst(newToken.contentModel, true);
      const flattened = flattenMixed(first.contentModel, true);
      newToken = new ElementDeclarationXToken(newToken.name, newToken.contentSpec, flattened.contentModel);
   }

   return newToken;
}

interface Result {
   seenPcData: boolean,
   contentModel: ContentModelX,
}

function putPCDataFirst(list: ContentModelX, topList: boolean): Result {
   let seenPcData = false;
   let particles = [...list.particles];

   for (let index = particles.length - 1; index >= 0; index--) {
      const item = particles[index];

      if (isContentNameX(item)) {
         if (item.name.toLocaleUpperCase() === '#PCDATA') {
            seenPcData = true;
            particles.splice(index, 1);
         }
      } else {
         const result = putPCDataFirst(item, false);;
         seenPcData = seenPcData || result.seenPcData;
         particles.splice(index, 1, result.contentModel);
      }
   }

   if (seenPcData && topList) {
      particles.unshift({
         name: '#PCDATA',
         repeat: CpRepeat.ONE,
      });
   }

   return {
      seenPcData,
      contentModel: {
         ...list,
         particles,
      }
   };
}

type SimpleMap = { [name: string]: boolean };
interface FlattenedResult {
   particles: Array<ContentNameX | ContentModelX>,
   contentModel: ContentModelX,
};
function flattenMixed(list: ContentModelX, topList: boolean): FlattenedResult {
   const listItem = list.particles[0];
   const isMixed = list.particles.length > 0 && isContentNameX(listItem) && listItem.name === '#PCDATA';

   if (topList && !isMixed) {
      return { particles: [], contentModel: list };
   }

   const particles = [...list.particles];

   for (let index = particles.length - 1; index >= 0; index--) {
      const item = particles[index];

      if (!isContentNameX(item)) {
         const flat = flattenMixed(item, false);
         const newChildren = flat.particles;
         particles.splice(index, 1, ...newChildren);
      }
   }

   let contentModel = list;

   if (topList) {
      const seenNames: SimpleMap = {};
      const newParticles = [];

      for (let index = 0; index < particles.length; index++) {
         let item = particles[index];

         if (isContentNameX(item) && !seenNames[item.name]) {
            seenNames[item.name] = true;
            item = {
               ...item,
               repeat: item.repeat || CpRepeat.ONE,
            };
            newParticles.push(item);
         }
      }

      contentModel = {
         ...contentModel,
         particles: newParticles,
         listType: CpType.CHOICE,
         repeat: particles.length === 1 ? CpRepeat.ONE : CpRepeat.ZEROPLUS,
      }
   }

   return {
      particles,
      contentModel,
   };
}

export default FixingStream;
