/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';

import {
   parseWordList,
   WordListType,
   WordListPToken,
} from '../wordList';

describe('wordList (integration)', () => {
   let wlPToken: WordListPToken;

   beforeEach(() => {
      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: SToken.fromString('('),
         openSpace: SToken.fromString(' '),
         words: [ {
            word: SToken.fromString('one'),
            wordSpace: undefined,
            connector: SToken.fromString('|'),
            connectorSpace: SToken.fromString(' '),
         }, {
            word: SToken.fromString('two'),
            wordSpace: undefined,
            connector: undefined,
            connectorSpace: undefined,
         }],
         close: SToken.fromString(')'),
         closeSpace: SToken.fromString(' '),
      });
   });

   describe('parseWordList()', () => {

      it('parses a simple wordList', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('( one| two) ');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (result) => {
            expect(result).toEqualRangeless(wlPToken);
            done();
         });
      });

      it('parses a malformed wordList', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('( | two three |');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (result) => {
            expect(result).toEqualRangeless({
               open: SToken.fromString('('),
               openSpace: SToken.fromString(' '),
               words: [ {
                  word: undefined,
                  wordSpace: undefined,
                  connector: SToken.fromString('|'),
                  connectorSpace: SToken.fromString(' '),
               }, {
                  word: SToken.fromString('two'),
                  wordSpace: SToken.fromString(' '),
                  connector: undefined,
                  connectorSpace: undefined,
               }, {
                  word: SToken.fromString('three'),
                  wordSpace: SToken.fromString(' '),
                  connector: SToken.fromString('|'),
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
