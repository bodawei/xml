/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';
import { parseWordList, WordListPToken, WordListType } from '../wordList';

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

   describe('WordListPToken', () => {
      it('will not let an instance be constructed without a words array', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, {
            open: toSToken('('),
            words: undefined,
         });

         expect(wlPToken.words).toEqual([]);
      });
   });

   describe('parseWordList()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('parses a two word enumeration', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', [')', '%', '>', '|']],
            [' ', 'space'],
            ['|', 'match', '|'],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', [')', '%', '>', '|']],
            [undefined, 'space'],
            [undefined, 'match', '|'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(wlPToken);
      });

      it('parses an empty enumeration', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
         ]);

         parseWordList(mockSource, WordListType.ENUMERATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('('),
            openSpace: toSToken(' '),
            words: [],
            close: toSToken(')'),
            closeSpace: undefined,
         });
      });

      it('parses a spaceless enumeration with a trailing |', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [undefined, 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', [')', '%', '>', '|']],
            [undefined, 'space'],
            ['|', 'match', '|'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('('),
            openSpace: undefined,
            words: [
               {
                  word: toSToken('one'),
                  wordSpace: undefined,
                  connector: toSToken('|'),
                  connectorSpace: undefined,
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
         });
      });

      it('parses a connectorless enumeration', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', [')', '%', '>', '|']],
            [' ', 'space'],
            [undefined, 'match', '|'],
            [undefined, 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', [')', '%', '>', '|']],
            [undefined, 'space'],
            [undefined, 'match', '|'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('('),
            openSpace: toSToken(' '),
            words: [
               {
                  word: toSToken('one'),
                  wordSpace: toSToken(' '),
                  connector: undefined,
                  connectorSpace: undefined,
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

      it('parses a wordless enumeration', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('|'),
            [undefined, 'word', [')', '%', '>', '|']],
            [undefined, 'space'],
            ['|', 'match', '|'],
            [undefined, 'space'],
            MockSTokenSource.PEEK('|'),
            [undefined, 'word', [')', '%', '>', '|']],
            [undefined, 'space'],
            ['|', 'match', '|'],
            [' ', 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('('),
            openSpace: toSToken(' '),
            words: [
               {
                  word: undefined,
                  wordSpace: undefined,
                  connector: toSToken('|'),
                  connectorSpace: undefined,
               },
               {
                  word: undefined,
                  wordSpace: undefined,
                  connector: toSToken('|'),
                  connectorSpace: toSToken(' '),
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
         });
      });

      it('returns nothing if there is no opening "("', () => {
         const mockSource = new MockSTokenSource([[undefined, 'match', '(']]);

         parseWordList(mockSource, WordListType.ENUMERATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toBeUndefined();
      });
   });
});
