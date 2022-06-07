/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';
import { parseWordList, WordListPToken, WordListType } from '../wordList';

describe('wordList (unit)', () => {
   let wlPToken: WordListPToken;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: SToken.fromString('('),
         openSpace: SToken.fromString(' '),
         words: [ {
            word: SToken.fromString('one'),
            wordSpace: SToken.fromString(' '),
            connector: SToken.fromString('|'),
            connectorSpace: SToken.fromString(' '),
         }, {
            word:  SToken.fromString('two'),
            wordSpace: undefined,
            connector: undefined,
            connectorSpace: undefined,
         }],
         close: SToken.fromString(')'),
         closeSpace: undefined,
      });
   });

   describe('WordListPToken', () => {

      it('will not let an instance be constructed without a words array', () => {

         wlPToken = new WordListPToken(WordListType.NOTATION, {
            open: SToken.fromString('('),
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
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ ')', '%', '>', '|' ] ],
            [ ' ', 'space' ],
            [ '|', 'match', '|' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ ')', '%', '>', '|' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '|' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(wlPToken);
      });

      it('parses an empty enumeration', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
         ]);

         parseWordList(mockSource, WordListType.ENUMERATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('('),
            openSpace: SToken.fromString(' '),
            words: [],
            close: SToken.fromString(')'),
            closeSpace: undefined,
         });
      });

      it('parses a spaceless enumeration with a trailing |', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ ')', '%', '>', '|' ] ],
            [ undefined, 'space' ],
            [ '|', 'match', '|' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('('),
            openSpace: undefined,
            words: [ {
               word: SToken.fromString('one'),
               wordSpace: undefined,
               connector: SToken.fromString('|'),
               connectorSpace: undefined,
            }],
            close: SToken.fromString(')'),
            closeSpace: undefined,
         });
      });

      it('parses a connectorless enumeration', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ ')', '%', '>', '|' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match', '|' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ ')', '%', '>', '|' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '|' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('('),
            openSpace: SToken.fromString(' '),
            words: [ {
               word: SToken.fromString('one'),
               wordSpace: SToken.fromString(' '),
               connector: undefined,
               connectorSpace: undefined,
            }, {
               word: SToken.fromString('two'),
               wordSpace: undefined,
               connector: undefined,
               connectorSpace: undefined,
            }],
            close: SToken.fromString(')'),
            closeSpace: undefined,
         });
      });

      it('parses a wordless enumeration', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('|'),
            [ undefined, 'word', [ ')', '%', '>', '|' ] ],
            [ undefined, 'space' ],
            [ '|', 'match', '|' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('|'),
            [ undefined, 'word', [ ')', '%', '>', '|' ] ],
            [ undefined, 'space' ],
            [ '|', 'match', '|' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
         ]);

         parseWordList(mockSource, WordListType.NOTATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('('),
            openSpace: SToken.fromString(' '),
            words: [ {
               word: undefined,
               wordSpace: undefined,
               connector: SToken.fromString('|'),
               connectorSpace: undefined,
            }, {
               word: undefined,
               wordSpace: undefined,
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            }],
            close: SToken.fromString(')'),
            closeSpace: undefined,
         });
      });

      it('returns nothing if there is no opening "("', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'match', '(' ],
         ]);

         parseWordList(mockSource, WordListType.ENUMERATION, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toBeUndefined();
      });

   });

});
