/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { defaultExtractors } from 'extractor';
import { toSToken, STokenSource } from 'basic';

import {
   parseWordList,
   WordListType,
   WordListPToken,
} from '../wordList';

describe('wordList (integration)', () => {
   let wlPToken: WordListPToken;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [ {
            word: toSToken('one'),
            wordSpace: undefined,
            connector: toSToken('|'),
            connectorSpace: toSToken(' '),
         }, {
            word: toSToken('two'),
            wordSpace: undefined,
            connector: undefined,
            connectorSpace: undefined,
         }],
         close: toSToken(')'),
         closeSpace: toSToken(' '),
      });
   });

   describe('parseWordList()', () => {

      it('parses a simple wordList', (done) => {
         const source = new STokenSource();
         source.addText('( one| two) ');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (result) => {
            expect(result).toEqualRangeless(wlPToken);
            done();
         });
      });

      it('parses a malformed wordList', (done) => {
         const source = new STokenSource();
         source.addText('( | two three |');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (result) => {
            expect(result).toEqualRangeless({
               open: toSToken('('),
               openSpace: toSToken(' '),
               words: [ {
                  word: undefined,
                  wordSpace: undefined,
                  connector: toSToken('|'),
                  connectorSpace: toSToken(' '),
               }, {
                  word: toSToken('two'),
                  wordSpace: toSToken(' '),
                  connector: undefined,
                  connectorSpace: undefined,
               }, {
                  word: toSToken('three'),
                  wordSpace: toSToken(' '),
                  connector: toSToken('|'),
                  connectorSpace: undefined,
               }],
               close: undefined,
               closeSpace: undefined,
            });
            done();
         });
      });

   });

});
