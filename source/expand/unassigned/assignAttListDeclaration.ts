/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   AttListPToken,
   AttDefPToken,
   WordListPToken,
   WordListType,
   UnassignedArray,
   UnassignedType,
} from 'token';

import { assignToProps } from './assignToProps';
import { assignWordList } from './assignWordList';

function adjustSpaces(attLiPToken: AttListPToken): void {
   const prevDef: AttDefPToken = attLiPToken.attDefs[0];

   if (!prevDef) {
      return;
   }

   if (prevDef.xtra) {
      attLiPToken.postElementNameSpace = attLiPToken.postElementNameSpace
         ? attLiPToken.postElementNameSpace.merge(prevDef.xtra)
         : prevDef.xtra;
      delete prevDef.xtra;
   }

   for (let index = 1; index < attLiPToken.attDefs.length; index++) {
      const current = attLiPToken.attDefs[index];

      if (current.xtra) {
         // need better definition here.
         if (prevDef.value) {
            prevDef.postValueSpace = prevDef.postValueSpace
               ? prevDef.postValueSpace.merge(current.xtra)
               : current.xtra;
         } else if (prevDef.defaultType) {
            prevDef.postDefaultTypeSpace = prevDef.postDefaultTypeSpace
               ? prevDef.postDefaultTypeSpace.merge(current.xtra)
               : current.xtra;
         } else if (prevDef.type) {
            prevDef.postTypeSpace = prevDef.postTypeSpace
               ? prevDef.postTypeSpace.merge(current.xtra)
               : current.xtra;
         } else {
            prevDef.postNameSpace = prevDef.postNameSpace
               ? prevDef.postNameSpace.merge(current.xtra)
               : current.xtra;
         }

         delete current.xtra;
      }
   }
}

function newWordListFromUnassigned(type: WordListType, unValues: UnassignedArray): WordListPToken {
   const list = new WordListPToken(type, { open: toSToken('(') });
   (list as any).open = undefined;

   // eslint-disable-next-line @typescript-eslint/no-use-before-define
   assignWordList(unValues, list);

   return list;
}

function assignAttListDeclaration(
   unassignedArray: UnassignedArray | undefined = [],
   attLiPToken: AttListPToken,
): void {
   const unValues = unassignedArray.slice(0);
   const hasRef = !!unValues.find((item) => item.type === UnassignedType.REFERENCE);
   let nextPropName = attLiPToken.nextPropName;

   if (unassignedArray.length === 0 || hasRef) {
      attLiPToken.extra = unValues;
      return;
   }

   if (nextPropName === 'elementName') {
      assignToProps(unValues, attLiPToken, nextPropName, [
         { name: 'declTypeSpace', type: 'space' },
         { name: 'elementName', type: 'word' },
         { name: 'postElementNameSpace', type: 'space' },
      ]);
      nextPropName = 'name';
   }

   let lastLength = 0;

   while (lastLength !== unValues.length && unValues.length !== 0) {
      const couldNeedList =
         nextPropName === 'name' || nextPropName === 'type' || nextPropName === 'defaultType';

      lastLength = unValues.length;
      const descriptors = [
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
         { name: 'type', type: 'word', allowed: /^[^#(].*/i },
         { name: 'postTypeSpace', type: 'space' },
      ];

      if (nextPropName === 'name') {
         // Working around TypeScript. this is wrong in some way.
         attLiPToken.attDefs.push({} as AttDefPToken);
         descriptors.unshift({ name: 'xtra', type: 'space' });
      }

      const nextDef = attLiPToken.attDefs[attLiPToken.attDefs.length - 1];
      assignToProps(unValues, nextDef, nextPropName, descriptors);

      if (
         couldNeedList &&
         (!nextDef.type || nextDef.type.str === '' || nextDef.type.str.toUpperCase() === 'NOTATION')
      ) {
         const enumeration = nextDef.enumeration;
         const beforeLength = unValues.length;
         const type =
            !nextDef.type || nextDef.type.str === ''
               ? WordListType.ENUMERATION
               : WordListType.NOTATION;

         if (enumeration) {
            assignWordList(unValues, enumeration);
            nextDef.enumeration = enumeration;
         } else {
            const newEnum = newWordListFromUnassigned(type, unValues);

            // only add the namelist if we seem to have actually consumed any unassigned values.
            if (beforeLength !== unValues.length) {
               nextDef.enumeration = newEnum;
            }
         }
      }

      const remainingDescriptors = [
         { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
         { name: 'postDefaultTypeSpace', type: 'space' },
         { name: 'value', type: 'literal' },
         { name: 'postValueSpace', type: 'space' },
      ];

      if (nextPropName === 'defaultType') {
         remainingDescriptors.unshift({ name: 'postTypeSpace', type: 'space' });
      }

      if (nextPropName === 'name' || nextPropName === 'type') {
         nextPropName = 'defaultType';
      }

      assignToProps(unValues, nextDef, nextPropName, remainingDescriptors);

      nextPropName = 'name';
   }

   adjustSpaces(attLiPToken);

   attLiPToken.extra = unValues;
}

export { assignAttListDeclaration };
