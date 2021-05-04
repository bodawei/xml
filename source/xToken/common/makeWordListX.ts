/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { WordListPToken } from 'token';

function makeWordListX(wordList: WordListPToken | undefined): ReadonlyArray<string> | undefined {
   if (!wordList) {
      return undefined;
   }

   const result: Array<string> = [];

   for (const word of wordList.words) {
      const wordString = strOrBlank(word.word);

      if (wordString) {
         result.push(wordString);
      }
   }

   return result;
}

export { makeWordListX };
