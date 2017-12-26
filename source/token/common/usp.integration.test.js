/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/test';

import entityReference from '../entityReference.js';
import text from '../text.js';

import * as usp from './usp.js';

describe('usp (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('returns nothing when at the end of input', (done) => {
         source.endText();

         usp.parse(source, {}, (pieces) => {
            expect(pieces).toEqual([]);
            done();
         });
      });

      it('returns nothing when encountering a ">" at start of input', (done) => {
         source.addText('>');
         source.endText();

         usp.parse(source, {}, (pieces) => {
            expect(pieces).toEqual([]);
            done();
         });
      });

      it('returns spaces, words, literals and parameter entity refs', (done) => {
         const makeSToken = makeSTokenMaker();
         source.addText(' "double"whatever\'single\'%peref;>');
         source.endText();

         usp.parse(source, {}, (pieces) => {
            expect(pieces).toEqual([ {
               type: 'space',
               space: makeSToken(' '),
            }, {
               type: 'literal',
               openQuote: makeSToken('"'),
               value: [ new text.PToken({ text: makeSToken('double') }) ],
               closeQuote: makeSToken('"'),
            }, {
               type: 'word',
               word: makeSToken('whatever'),
            }, {
               type: 'literal',
               openQuote: makeSToken('\''),
               value: [ new text.PToken({ text: makeSToken('single') }) ],
               closeQuote: makeSToken('\''),
            }, new entityReference.ParamPToken({
               open: makeSToken('%'),
               postOpenSpace: undefined,
               name: makeSToken('peref'),
               postNameSpace: undefined,
               close: makeSToken(';'),
            }) ]);
            done();
         });
      });

   });

});
