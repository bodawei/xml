/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { WordListPToken, WordListType } from 'token';
import { describe, expect, it } from 'vitest';

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
