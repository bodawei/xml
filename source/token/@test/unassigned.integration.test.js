/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import entityReference from '../entityReference.js';
import text from '../text.js';
import unassigned from '../unassigned.js';

describe('unassigned (integration)', () => {
   let emd;
   let source;
   let makeSToken;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
      makeSToken = makeSTokenMaker();
   });

   describe('checkForPERef()', () => {

      it('returns nothing when there is no parameter entity reference', (done) => {
         source.addText('asdf');
         source.endText();

         unassigned.checkForPERef(source, (pieces) => {
            expect(pieces).toBeUndefined();
            done();
         });
      });

      it('returns an array of unassigned values when a param entity ref found', (done) => {
         source.addText('%peref; "double"whatever\'single\'%peref;>');
         source.endText();

         unassigned.checkForPERef(source, (pieces) => {
            expect(pieces).toEqual([
            new entityReference.ParamPToken({
               open: makeSToken('%'),
               postOpenSpace: undefined,
               name: makeSToken('peref'),
               postNameSpace: undefined,
               close: makeSToken(';'),
            }), unassigned.spaceFromSToken(makeSToken(' ')), {
               type: 'literal',
               openQuote: makeSToken('"'),
               value: [ new text.PToken({ text: makeSToken('double') }) ],
               closeQuote: makeSToken('"'),
            }, unassigned.wordFromSToken(makeSToken('whatever')), {
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

   describe('parseNextValue()', () => {

      it('delivers an undefined value', (done) => {
         source.addText('%peref; "double"whatever\'single\'%peref;>');
         source.endText();

         unassigned.parseNextValue(source, false, (value) => {
            expect(value).toEqual(new entityReference.ParamPToken({
               open: makeSToken('%'),
               postOpenSpace: undefined,
               name: makeSToken('peref'),
               postNameSpace: undefined,
               close: makeSToken(';'),
            }));
            done();
         });
      });

   });

});
