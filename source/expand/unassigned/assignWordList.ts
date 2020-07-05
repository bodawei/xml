/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { WordListPToken, UnassignedArray, UnassignedType, WordListEntryPToken } from 'token';

import { assignToProps } from './assignToProps';
import { DescriptorArray } from './types';

console.log('xxxx', assignToProps.toString());

// Try to fill in the : '(' S?
function assignListOpen(wlPToken: WordListPToken, unValues: UnassignedArray): void {
   const openDescriptors: DescriptorArray = [];
   let startProp;

   if (wlPToken.words.length > 0 || wlPToken.close) {
      return;
   }

   if (!wlPToken.open) {
      openDescriptors.push({ name: 'open', type: 'word', allowed: /\(/ });
      startProp = 'open';
   }

   if (!wlPToken.openSpace) {
      openDescriptors.push({ name: 'openSpace', type: 'space' });
      startProp = startProp || 'openSpace';
   }

   if (startProp) {
      assignToProps(unValues, wlPToken, startProp, openDescriptors);
   }
}

function assignNames(wlPToken: WordListPToken, unValues: UnassignedArray): void {
   if (wlPToken.close || wlPToken.closeSpace) {
      return;
   }

   const words: Array<WordListEntryPToken> = wlPToken.words;
   let mode = words.length === 0 ? 'firstWord' : 'partialWord';
   let nextUnValue = unValues[0];

   while (nextUnValue) {
      let wordEntry: WordListEntryPToken = {
         word: undefined,
         wordSpace: undefined,
         connector: undefined,
         connectorSpace: undefined,
      };
      const descriptors: DescriptorArray = [];
      let startProp;

      if (
         nextUnValue.type === 'literal' ||
         (nextUnValue.type === 'word' &&
            nextUnValue.token.text &&
            nextUnValue.token.text.str === ')')
      ) {
         return;
      }

      switch (mode) {
         case 'firstWord':
            assignToProps(unValues, wlPToken, 'openSpace', [{ name: 'openSpace', type: 'space' }]);
            break;
         case 'partialWord':
            wordEntry = words[words.length - 1];
            // We'll re-insert it below.
            words.pop();
            break;
         default:
            // Deal with any leading spaces in the unValues, before turning to the next word
            const lastEntry = words[words.length - 1];
            const lastSpace = lastEntry.connector ? 'connectorSpace' : 'wordSpace';
            assignToProps(unValues, lastEntry, lastSpace, [{ name: lastSpace, type: 'space' }]);
            break;
      }

      mode = 'defaultNewWord';
      startProp = 'connectorSpace';
      descriptors.push({ name: 'connectorSpace', type: 'space' });

      if (!wordEntry.connector) {
         // Will that match .*|.* ?
         descriptors.unshift({ name: 'connector', type: 'word', allowed: /\|/ });
         startProp = 'connector';

         if (!wordEntry.wordSpace) {
            descriptors.unshift({ name: 'wordSpace', type: 'space' });
            startProp = 'wordSpace';

            if (!wordEntry.word) {
               descriptors.unshift({ name: 'word', type: 'word', allowed: /[^)|]/ });
               startProp = 'word';
            }
         }
      }

      assignToProps(unValues, wordEntry, startProp, descriptors);

      words.push(wordEntry);
      nextUnValue = unValues[0];
   }
}

function assignListClose(wlPToken: WordListPToken, unValues: UnassignedArray): void {
   const words = wlPToken.words;
   const closeDescriptors: DescriptorArray = [];
   const hasWords = words.length > 0;
   let closeProp;

   /*
    * In case the first unValue is a space, attach it to:
    *    the openSpace if we have no ( and no words
    *    the last word (if any) after word or connector, or
    *    otherwise the closeSpace
    */
   if (!wlPToken.close) {
      if (!hasWords) {
         closeDescriptors.push({ name: 'openSpace', type: 'space' });
         closeProp = 'openSpace';
      } else {
         const lastEntry = words[words.length - 1];
         const lastSpace = lastEntry.connector ? 'connectorSpace' : 'wordSpace';

         assignToProps(unValues, lastEntry, lastSpace, [{ name: lastSpace, type: 'space' }]);
      }

      closeDescriptors.push({ name: 'close', type: 'word', allowed: /\)/ });
      closeProp = closeProp || 'close';
   }

   closeDescriptors.push({ name: 'closeSpace', type: 'space' });
   closeProp = closeProp || 'closeSpace';

   assignToProps(unValues, wlPToken, closeProp, closeDescriptors);
}

function assignWordList(unValues: UnassignedArray, wlPToken: WordListPToken): void {
   if (unValues.length === 0) {
      return;
   }

   const unexpandedRef = unValues.filter((item) => item.type === UnassignedType.REFERENCE);

   if (unexpandedRef.length !== 0) {
      return;
   }

   assignListOpen(wlPToken, unValues);
   assignNames(wlPToken, unValues);
   assignListClose(wlPToken, unValues);
}

export { assignWordList };
