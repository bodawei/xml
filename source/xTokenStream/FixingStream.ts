/* Copyright ® 2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';

import tokenNs from '../token';
import { ElementDeclaration, isXName } from '../token/elementDeclaration';
import nameList, { XName, XNameList } from '../token/contentspec/nameList';

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

class FixingStream extends stream.Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(token: any, encoding: string, callback: () => {}) {
      if (token instanceof tokenNs.attListDeclaration.XToken) {
         adjustAttListDeclaration(token);
      } else if (token instanceof tokenNs.elementDeclaration.XToken) {
         adjustElementDeclaration(token);
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

function adjustElementDeclaration(token: ElementDeclaration) {
   const contentSpecType = token.contentSpecType || '';
   const capContentSpecType = contentSpecType.toLocaleUpperCase();

   // should fix all the names somehow

   if (ALLOWED_CONTENT_SPEC_TYPES.indexOf(capContentSpecType) === -1) {
      token.contentSpecType = token.children ? 'CHILDREN' : 'ANY';
   } else if (contentSpecType !== capContentSpecType) {
      token.contentSpecType = capContentSpecType;
   }

   if (token.contentSpecType === 'ANY' || token.contentSpecType === 'EMPTY') {
      delete token.children;
   }

   if (token.children) {
      putPCDataFirst(token.children, true);
      flattenMixed(token.children, true);
   }
}

function putPCDataFirst(list: XNameList, topList: boolean): boolean {
   let seenPCData = false;

   for (let index = list.names.length - 1; index >= 0; index--) {
      const item = list.names[index];

      if (isXName(item)) {
         if (item.name.toLocaleUpperCase() === '#PCDATA') {
            seenPCData = true;
            list.names.splice(index, 1);
         }
      } else {
         seenPCData = seenPCData || putPCDataFirst(item, false);
      }
   }

   if (seenPCData && topList) {
      list.names.unshift({
         name: '#PCDATA',
         repeat: 'ONE',
      });
   }

   return seenPCData;
}

type SimpleMap = {[name:string]:boolean};

function flattenMixed(list: XNameList, topList: boolean): Array<XName> {
   const listItem = list.names[0];
   const isMixed = list.names.length > 0 && isXName(listItem) && listItem.name === '#PCDATA';

   if (topList && !isMixed) {
      return [];
   }

   for (let index = list.names.length - 1; index >= 0; index--) {
      const item = list.names[index];

      if (!isXName(item)) {
         const newChildren = flattenMixed(item, false);
         list.names.splice(index, 1, ...newChildren);
      }
   }

   if (topList) {
      const seenNames: SimpleMap = {};
      const newNames: Array<XName> = [];

      for (let index = 0; index <  list.names.length; index++) {
         const item = list.names[index];

         if (isXName(item) && !seenNames[item.name]) {
            seenNames[item.name] = true;
            newNames.push(item);
            item.repeat = 'ONE';
         }
      }

      list.names = newNames;
      list.listType = 'CHOICE';
      list.repeat = list.names.length === 1 ? 'ONE' : 'ZEROPLUS';
   }

   return list.names as Array<XName>;
}

export default FixingStream;
