/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';
import { parseWordList, WordListPToken, WordListType } from '../wordList';
import { WellFormedError } from '../../../error/index';

import misc from '../../common/misc';

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

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let confVer: ConformanceVersion;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         confVer = new ConformanceVersion();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkNMToken');
      });

      it('checks if the enumeration word matches the requirements for words', () => {
         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(misc.checkName).toHaveBeenCalledWith(
            wlPToken.words[0].word, mockErrorCollector, confVer, WellFormedError.ID.WORDLIST_INVALID_NAME);
      });

      it('checks if the enumeration word matches the requirements for nmToken', () => {
         wlPToken = new WordListPToken(WordListType.ENUMERATION, wlPToken);

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(misc.checkNMToken).toHaveBeenCalledWith(
            wlPToken.words[0].word, mockErrorCollector, confVer, WellFormedError.ID.WORDLIST_INVALID_NMTOKEN);
      });

      it('reports no errors if a well formed pToken provided', () => {
         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if no words are present', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
         });

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.WORDLIST_NO_WORDS,
            params: undefined,
            position: undefined,
            lastPosition: wlPToken.openSpace,
         });
      });

      it('reports an error if a word in an entry is not present', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [ {
               word: undefined,
               wordSpace: SToken.fromString(' '),
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            } ],
         });

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.WORDLIST_NO_WORD,
            params: [ '0' ],
            position: undefined,
            lastPosition: wlPToken.openSpace,
         });
      });

      it('reports an error if a connector in an entry is not present', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [ {
               word: SToken.fromString('xxx'),
               wordSpace: SToken.fromString(' '),
               connector: undefined,
               connectorSpace: SToken.fromString(' '),
            }, {
               word: SToken.fromString('two'),
               wordSpace: SToken.fromString(' '),
               connector: undefined,
               connectorSpace: SToken.fromString(' '),
            } ],
         });

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.WORDLIST_NO_CONNECTOR,
            params: [ '0' ],
            position: undefined,
            lastPosition: wlPToken.words[0].wordSpace,
         });
      });

      it('reports an error if a there is a trailing connector', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [ {
               word: undefined,
               wordSpace: SToken.fromString(' '),
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            } ],
         });

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.WORDLIST_NO_WORD,
            params: [ '1' ],
            position: wlPToken.words[0].connector,
         });
      });

      it('reports an error if there is no close', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
         });

         wlPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.WORDLIST_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: wlPToken.words[1].word,
         });
      });

   });

   describe('pToken.toXToken()', () => {

      it('returns the words', () => {
         const xWords = wlPToken.toXToken();

         expect(xWords).toEqual(['one', 'two']);
      });

      it('returns an empty result if no words', () => {
         (wlPToken as any).words = []; // typeHack

         const xWords = wlPToken.toXToken();

         expect(xWords).toEqual([]);
      });

      it('silently ignores entries without words', () => {
         delete (wlPToken as any).words[0].word; // typeHack

         const xWords = wlPToken.toXToken();

         expect(xWords).toEqual(['two']);
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('returns the STokens', () => {
         const tokens = wlPToken.toSTokenArray();

         expect(tokens).toEqual([
            wlPToken.open,
            wlPToken.openSpace,
            wlPToken.words[0].word,
            wlPToken.words[0].wordSpace,
            wlPToken.words[0].connector,
            wlPToken.words[0].connectorSpace,
            wlPToken.words[1].word,
            wlPToken.close,
         ] as Array<SToken>);
      });

   });

});
