/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { WordListPToken, WordListType } from 'token';
import { wordListToSTokens } from '../wordListToSTokens';

describe('wordListToSTokens (unit)', () => {
   it('returns the STokens', () => {
      const wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [
            {
               word: toSToken('one'),
               wordSpace: toSToken(' '),
               connector: toSToken('|'),
               connectorSpace: toSToken(' '),
            },
            {
               word: toSToken('two'),
               wordSpace: undefined,
               connector: undefined,
               connectorSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
      });

      expect(wordListToSTokens(wlPToken)).toEqual([
         wlPToken.open,
         wlPToken.openSpace,
         wlPToken.words[0].word,
         wlPToken.words[0].wordSpace,
         wlPToken.words[0].connector,
         wlPToken.words[0].connectorSpace,
         wlPToken.words[1].word,
         wlPToken.close,
      ]);
   });
});
