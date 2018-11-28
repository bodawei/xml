/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../../basic/index';
import { defaultExtractors } from '../../../extractor/index';
import { SToken, STokenSource } from '../../../sToken/index';

import unassigned from '../../common/unassigned';
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
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one| two) ');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (result) => {
            expect(result).toEqualRangeless(wlPToken);
            done();
         });
      });

      it('parses a malformed wordList', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
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

   describe('pToken.assignUnassigned()', () => {

      it('fills in a simple list of names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one| %foo;');
         source.endText();

         parseWordList(source, WordListType.NOTATION, (pToken) => {
            const sourceTwo = new STokenSource(defaultExtractors, new EntityMetaData());
            sourceTwo.addText('four | five six ||)');
            sourceTwo.endText();

            unassigned.parseAllValues(sourceTwo, true, (unassignedValues) => {
               const newPToken = pToken!.newWithUnassigned(unassignedValues!);

               expect(newPToken).toEqualRangeless({
                  open: SToken.fromString('('),
                  openSpace: SToken.fromString(' '),
                  words: [ {
                     word: SToken.fromString('one'),
                     wordSpace: undefined,
                     connector: SToken.fromString('|'),
                     connectorSpace: SToken.fromString(' '),
                  }, {
                     word: SToken.fromString('four'),
                     wordSpace: SToken.fromString(' '),
                     connector: SToken.fromString('|'),
                     connectorSpace: SToken.fromString(' '),
                  }, {
                     word: SToken.fromString('five'),
                     wordSpace: SToken.fromString(' '),
                     connector: undefined,
                     connectorSpace: undefined,
                  }, {
                     word: SToken.fromString('six'),
                     wordSpace: SToken.fromString(' '),
                     connector: SToken.fromString('|'),
                     connectorSpace: undefined,
                  }, {
                     word: undefined,
                     wordSpace: undefined,
                     connector: SToken.fromString('|'),
                     connectorSpace: undefined,
                  }],
                  close: SToken.fromString(')'),
                  closeSpace: undefined,
               });

               done();
            });
         });
      });

   });

});
