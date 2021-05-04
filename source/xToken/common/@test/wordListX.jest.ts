/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { WordListPToken, WordListType } from 'token';

import { makeWordListX } from '../makeWordListX';

describe('wordList (unit)', () => {
   let wlPToken: WordListPToken;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
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
   });

   it('returns the words', () => {
      const xWords = makeWordListX(wlPToken);

      expect(xWords).toEqual(['one', 'two']);
   });

   it('returns an empty result if no words', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [],
         close: toSToken(')'),
         closeSpace: undefined,
      });

      const xWords = makeWordListX(wlPToken);

      expect(xWords).toEqual([]);
   });

   it('silently ignores entries without words', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [
            {
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

      const xWords = makeWordListX(wlPToken);

      expect(xWords).toEqual(['two']);
   });
});
