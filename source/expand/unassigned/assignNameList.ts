/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { NamePToken, NameListPToken, ContentParticlePToken, UnassignedArray } from 'token';

import { assignToProps } from './assignToProps';
import { DescriptorArray } from './types';

function assignListOpen(nameList: NameListPToken, unValues: UnassignedArray): void {
   let needOpen = nameList.names.length === 0;
   let openProp = 'postOpenSpace';
   const openDescriptors: DescriptorArray = [{ name: 'postOpenSpace', type: 'space' }];

   if (!nameList.open) {
      openDescriptors.unshift({ name: 'open', type: 'word', allowed: /\(/ });
      openProp = 'open';
      needOpen = true;
   }

   if (needOpen) {
      assignToProps(unValues, nameList, openProp, openDescriptors);
   }
}

function assignListClose(nameList: NameListPToken, unValues: UnassignedArray): void {
   let closeProp = 'postRepeatSpace';
   const closeDescriptors: DescriptorArray = [{ name: 'postRepeatSpace', type: 'space' }];

   if (!nameList.repeat) {
      closeDescriptors.unshift({ name: 'repeat', type: 'word', allowed: /[*+?]/ });
      closeDescriptors.unshift({ name: 'postCloseSpace', type: 'space' });
      closeProp = 'repeat';
   }

   if (!nameList.close) {
      closeDescriptors.unshift({ name: 'close', type: 'word', allowed: /\)/ });
      closeProp = 'close';
   }

   assignToProps(unValues, nameList, closeProp, closeDescriptors);
}

function assignList(nameList: NameListPToken, unValues: UnassignedArray): void {
   assignListOpen(nameList, unValues);

   if (
      !nameList.repeat &&
      !nameList.close &&
      !nameList.postRepeatSpace &&
      !nameList.postCloseSpace
   ) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      assignNames(nameList.names, unValues);
   }

   assignListClose(nameList, unValues);
}

function assignIncompleteName(cp: ContentParticlePToken, unValues: UnassignedArray): void {
   if (cp.delimiter || cp.postDelimiterSpace) {
      assignToProps(unValues, cp, 'postDelimiterSpace', [
         { name: 'postDelimiterSpace', type: 'space' },
      ]);
      return;
   } else if (cp.particle instanceof NameListPToken) {
      // If end up with an empty-ish namelistptoken, you'll lose a space.
      assignList(cp.particle, unValues);
   } else {
      let startProp = 'postRepeatSpace';
      const descriptors: DescriptorArray = [{ name: 'postRepeatSpace', type: 'space' }];

      if (!cp.particle) {
         cp.particle = {};
      }

      if (!cp.particle.repeat) {
         descriptors.unshift({ name: 'repeat', type: 'word', allowed: /[*+?]/ });
         descriptors.unshift({ name: 'postNameSpace', type: 'space' });
         startProp = 'repeat';
      }

      if (!cp.particle.name) {
         descriptors.unshift({ name: 'name', type: 'word', allowed: /[^)|,*+?]/ });
         startProp = 'name';
      }

      assignToProps(unValues, cp.particle, startProp, descriptors);
   }

   assignToProps(unValues, cp, 'delimiter', [
      { name: 'delimiter', type: 'word', allowed: /[|,]/ },
      { name: 'postDelimiterSpace', type: 'space' },
   ]);
}

// We may want to completely prevent any sublists in the ENUMERATION etc. in both parse and unassigned
// checkwellformed should report on #PCDATA as a bad name if not in position 0
// @@ Myust consume space.  And will we inadvertantly consume stuff from the delimiter wrongly?
function assignNames(names: Array<ContentParticlePToken>, unValues: UnassignedArray): void {
   if (names.length > 0) {
      assignIncompleteName(names[names.length - 1], unValues);
   }

   let cp: ContentParticlePToken;
   let particle: NameListPToken | NamePToken;
   let nextUnValue = unValues[0];

   while (nextUnValue) {
      if (
         nextUnValue.type !== 'word' ||
         (nextUnValue.token.text && nextUnValue.token.text.str === ')')
      ) {
         return;
      }

      if (nextUnValue.token.text && nextUnValue.token.text.str === '(') {
         const nlPToken = new NameListPToken();
         particle = nlPToken;
         assignList(nlPToken, unValues);
      } else {
         particle = {};
         assignToProps(unValues, particle, 'name', [
            { name: 'name', type: 'word', allowed: /[^)|,*+?]/ },
            { name: 'postNameSpace', type: 'space' },
            { name: 'repeat', type: 'word', allowed: /[*+?]/ },
            { name: 'postRepeatSpace', type: 'space' },
         ]);
      }
      cp = { particle };
      assignToProps(unValues, cp, 'delimiter', [
         { name: 'delimiter', type: 'word', allowed: /[|,]/ },
         { name: 'postDelimiterSpace', type: 'space' },
      ]);
      names.push(cp);

      nextUnValue = unValues[0];
   }
}

function assignNameList(nameListPToken: NameListPToken, unValues: UnassignedArray): void {
   if (unValues.length === 0) {
      return;
   }

   const unexpandedRef = unValues.filter((item) => item.type === 'reference');

   if (unexpandedRef.length !== 0) {
      return;
   }

   assignList(nameListPToken, unValues);
}

export { assignNameList };
