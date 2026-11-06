/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'basic';
import { WordListPToken, WordListType } from 'token';

import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { nameCheck } from '../nameCheck';
import { nmTokenCheck } from '../nmTokenCheck';
import { wordListCheck } from '../wordlistCheck';

jest.mock('../nmTokenCheck');
jest.mock('../nameCheck');

const WFEID = wellFormedErrorCodes.id;

describe('wordListCheck (unit)', () => {
   let wlPToken: WordListPToken;
   let collector: ParamCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         close: toSToken(')'),
         closeSpace: undefined,
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [
            {
               connector: toSToken('|'),
               connectorSpace: toSToken(' '),
               word: toSToken('one'),
               wordSpace: toSToken(' '),
            },
            {
               connector: undefined,
               connectorSpace: undefined,
               word: toSToken('two'),
               wordSpace: undefined,
            },
         ],
      });

      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('checks if the enumeration word matches the requirements for words', () => {
      wordListCheck(wlPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         wlPToken.words[0].word,
         collector,
         confVer,
         WFEID.WORDLIST_INVALID_NAME,
      );
   });

   it('checks if the enumeration word matches the requirements for nmToken', () => {
      wlPToken = new WordListPToken(WordListType.ENUMERATION, wlPToken);

      wordListCheck(wlPToken, collector, confVer);

      expect(nmTokenCheck).toHaveBeenCalledWith(
         wlPToken.words[0].word,
         collector,
         confVer,
         WFEID.WORDLIST_INVALID_NMTOKEN,
      );
   });

   it('reports no errors if a well formed pToken provided', () => {
      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if no words are present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
      });

      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.WORDLIST_NO_WORDS,
         lastPosition: wlPToken.openSpace,
         params: [],
         position: undefined,
      });
   });

   it('reports an error if a word in an entry is not present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               connector: toSToken('|'),
               connectorSpace: toSToken(' '),
               word: undefined,
               wordSpace: toSToken(' '),
            },
         ],
      });

      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.WORDLIST_NO_WORD,
         lastPosition: wlPToken.openSpace,
         params: ['0'],
         position: undefined,
      });
   });

   it('reports an error if a connector in an entry is not present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               connector: undefined,
               connectorSpace: toSToken(' '),
               word: toSToken('xxx'),
               wordSpace: toSToken(' '),
            },
            {
               connector: undefined,
               connectorSpace: toSToken(' '),
               word: toSToken('two'),
               wordSpace: toSToken(' '),
            },
         ],
      });

      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.WORDLIST_NO_CONNECTOR,
         lastPosition: wlPToken.words[0].wordSpace,
         params: ['0'],
         position: undefined,
      });
   });

   it('reports an error if a there is a trailing connector', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [
            {
               connector: toSToken('|'),
               connectorSpace: toSToken(' '),
               word: undefined,
               wordSpace: toSToken(' '),
            },
         ],
      });

      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.WORDLIST_NO_WORD,
         params: ['1'],
         position: wlPToken.words[0].connector,
      });
   });

   it('reports an error if there is no close', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
      });

      wordListCheck(wlPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.WORDLIST_NO_CLOSE,
         lastPosition: wlPToken.words[1].word,
         params: [],
         position: undefined,
      });
   });
});
