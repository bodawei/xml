/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';
import { parseWordList, WordListPToken, WordListType, ENUMERATION_PTOKEN } from '../wordList';
import { WellFormedError } from '../../../error/index';

import text from '../../text';
import unassigned, { UnassignedType, UnassignedArray } from '../../common/unassigned';

import misc from '../../common/misc';
import { ParameterEntityReferencePToken } from 'source/token/parameterEntityReference';

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

   describe('assignUnassigned()', () => {
      let assignSpy: jasmine.Spy;
      let unValues: UnassignedArray;

      beforeEach(() => {
         assignSpy = spyOn(unassigned, 'assignToProps').and.callFake((unValues: Array<any>) => {
            unValues.pop();
         });
         unValues = [ {
            type: UnassignedType.WORD,
            token: new text.PToken({ text: SToken.fromString('foo') })
         } ];
      });

      it('does nothing if there is no unassigned array', () => {
         expect(() => wlPToken.newWithUnassigned([])).not.toThrow();
      });

      it('does nothing if there is still an unexpanded parameter entity reference', () => {
         wlPToken.newWithUnassigned([ {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })
         } ]);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls assignToProps() with the opening of the list open descriptors', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            openSpace: undefined,
            words: [],
            close: undefined,
         });
         (wlPToken as any).open = undefined;

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken,
            'open', [
               { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
               { name: 'openSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('does no assignment if the first unassigned value is a literal', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         unValues[0].type = UnassignedType.LITERAL;

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'wordSpace', [
               { name: 'wordSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('does no assignment of words if the first unassigned value is a ")"', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         (unValues[0].token as any).text = '(';

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'wordSpace', [
               { name: 'wordSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() without the opening of the list open descriptors', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            openSpace: undefined,
            words: [],
            close: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken,
            'openSpace', [
               { name: 'openSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() without the closing of the list open descriptors', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
            close: undefined,
            closeSpace: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken,
            'close', [
               { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
               { name: 'closeSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the closing of the list open descriptors', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
            closeSpace: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken,
            'closeSpace', [
               { name: 'closeSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the previous space position when no words', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
            close: undefined,
            closeSpace: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken,
            'openSpace', [
               { name: 'openSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the space in the previous word when doing a new word', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         // insert a second item which, in this mocked case, will loop around to a default new word
         unValues.push({
            type: UnassignedType.WORD,
            token: new text.PToken({ text: SToken.fromString('foo') })
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'wordSpace', [
               { name: 'wordSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the connector in the previous word when doing a new word', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         (wlPToken.words[1] as any).connector = SToken.fromString('|');
         // insert a second item which, in this mocked case, will loop around to a default new word
         unValues.push({
            type: UnassignedType.WORD,
            token: new text.PToken({ text: SToken.fromString('foo') })
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'connectorSpace', [
               { name: 'connectorSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the properties to fill a word when no words present', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
            close: undefined,
            closeSpace: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            {
               word: undefined,
               wordSpace: undefined,
               connector: undefined,
               connectorSpace: undefined,
            },
            'word', [
               { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
               { name: 'wordSpace', type: UnassignedType.SPACE },
               { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
               { name: 'connectorSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the properties to fill a word when the previous word has all but a space', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         (wlPToken as any).words[1].wordSpace = SToken.fromString(' ');
         (wlPToken as any).words[1].connector = SToken.fromString('|');

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'connectorSpace', [
               // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
               // { name: 'wordSpace', type: UnassignedType.SPACE },
               // { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
               { name: 'connectorSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the properties to fill a word when the previous word has no connector', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });
         (wlPToken as any).words[1].wordSpace = SToken.fromString(' ');

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'connector', [
               // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
               // { name: 'wordSpace', type: UnassignedType.SPACE },
               { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
               { name: 'connectorSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the properties to fill a word when the previous has only the word', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            close: undefined,
            closeSpace: undefined,
         });

         wlPToken.newWithUnassigned(unValues);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            unValues,
            wlPToken.words[1],
            'wordSpace', [
               // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
               { name: 'wordSpace', type: UnassignedType.SPACE },
               { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
               { name: 'connectorSpace', type: UnassignedType.SPACE },
            ]);
      });

   });

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkNMToken');
      });

      it('checks if the enumeration word matches the requirements for words', () => {
         wlPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(
            wlPToken.words[0].word, mockErrorCollector, emd, WellFormedError.ID.WORDLIST_INVALID_NAME);
      });

      it('checks if the enumeration word matches the requirements for nmToken', () => {
         wlPToken = new WordListPToken(WordListType.ENUMERATION, wlPToken);

         wlPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkNMToken).toHaveBeenCalledWith(
            wlPToken.words[0].word, mockErrorCollector, emd, WellFormedError.ID.WORDLIST_INVALID_NMTOKEN);
      });

      it('reports no errors if a well formed pToken provided', () => {
         wlPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if no words are present', () => {
         wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
            words: [],
         });

         wlPToken.checkWellFormed(mockErrorCollector, emd);

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

         wlPToken.checkWellFormed(mockErrorCollector, emd);

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

         wlPToken.checkWellFormed(mockErrorCollector, emd);

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

         wlPToken.checkWellFormed(mockErrorCollector, emd);

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

         wlPToken.checkWellFormed(mockErrorCollector, emd);

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
