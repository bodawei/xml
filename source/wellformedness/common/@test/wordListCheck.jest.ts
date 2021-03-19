/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { SToken } from 'sToken';
import { WordListPToken, WordListType } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { nameCheck } from '../nameCheck';
import { nmTokenCheck } from '../nmTokenCheck';
import { wordListCheck } from '../wordListCheck';

jest.mock('../nmTokenCheck');
jest.mock('../nameCheck');

describe('wordListCheck (unit)', () => {
   let wlPToken: WordListPToken;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: SToken.fromString('('),
         openSpace: SToken.fromString(' '),
         words: [
            {
               word: SToken.fromString('one'),
               wordSpace: SToken.fromString(' '),
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            },
            {
               word: SToken.fromString('two'),
               wordSpace: undefined,
               connector: undefined,
               connectorSpace: undefined,
            },
         ],
         close: SToken.fromString(')'),
         closeSpace: undefined,
      });

      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
   });

   it('checks if the enumeration word matches the requirements for words', () => {
      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         wlPToken.words[0].word,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.WORDLIST_INVALID_NAME,
      );
   });

   it('checks if the enumeration word matches the requirements for nmToken', () => {
      wlPToken = new WordListPToken(WordListType.ENUMERATION, wlPToken);

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(nmTokenCheck).toHaveBeenCalledWith(
         wlPToken.words[0].word,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.WORDLIST_INVALID_NMTOKEN,
      );
   });

   it('reports no errors if a well formed pToken provided', () => {
      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if no words are present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
      });

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.WORDLIST_NO_WORDS,
         params: undefined,
         position: undefined,
         lastPosition: wlPToken.openSpace,
      });
   });

   it('reports an error if a word in an entry is not present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               word: undefined,
               wordSpace: SToken.fromString(' '),
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            },
         ],
      });

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.WORDLIST_NO_WORD,
         params: ['0'],
         position: undefined,
         lastPosition: wlPToken.openSpace,
      });
   });

   it('reports an error if a connector in an entry is not present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               word: SToken.fromString('xxx'),
               wordSpace: SToken.fromString(' '),
               connector: undefined,
               connectorSpace: SToken.fromString(' '),
            },
            {
               word: SToken.fromString('two'),
               wordSpace: SToken.fromString(' '),
               connector: undefined,
               connectorSpace: SToken.fromString(' '),
            },
         ],
      });

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.WORDLIST_NO_CONNECTOR,
         params: ['0'],
         position: undefined,
         lastPosition: wlPToken.words[0].wordSpace,
      });
   });

   it('reports an error if a there is a trailing connector', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               word: undefined,
               wordSpace: SToken.fromString(' '),
               connector: SToken.fromString('|'),
               connectorSpace: SToken.fromString(' '),
            },
         ],
      });

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.WORDLIST_NO_WORD,
         params: ['1'],
         position: wlPToken.words[0].connector,
      });
   });

   it('reports an error if there is no close', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
      });

      wordListCheck(wlPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.WORDLIST_NO_CLOSE,
         params: undefined,
         position: undefined,
         lastPosition: wlPToken.words[1].word,
      });
   });
});
