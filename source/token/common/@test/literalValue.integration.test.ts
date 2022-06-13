/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { CharRefPToken, GeneralEntityReferencePToken, ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { SToken } from '../../../basic/sToken/sToken';
import { STokenSource, toSToken } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import literalValue from '../literalValue';

describe('literalValue (integration)', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   describe('parse()', () => {

      it('ignores PE and GE References if not told to attend to them', (done) => {
         source.addText('one%peref;two&geref;&geref2;three"');
         source.endText();

         literalValue.parse(source, ['"'], (pToken) => {
            expect(pToken).toEqualRangeless([
                  new TextPToken({ text: toSToken('one%peref;two&geref;&geref2;three') }),
               ]);
            done();
         });
      });

      it('parses PE and GE and char References when told to attend to them', (done) => {
         const pToken = {};
         source.addText('one%peref;&#32;&geref;&geref2;three"');
         source.endText();

         literalValue.parse(source, ['"', '%', '&', '&#'], (pToken) => {
            const makeSToken = makeSTokenMaker();
            const expected = [
               new TextPToken({ text: makeSToken('one') }),
               new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: undefined,
                  name: makeSToken('peref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
               new CharRefPToken({
                  open: makeSToken('&#'),
                  openSpace: undefined,
                  hexMarkerSpace: undefined,
                  digits: makeSToken('32'),
                  digitsSpace: undefined,
                  close: makeSToken(';'),
                  charCode: 32,
               }),
               new GeneralEntityReferencePToken({
                  open: makeSToken('&'),
                  openSpace: undefined,
                  name: makeSToken('geref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
               new GeneralEntityReferencePToken({
                  open: makeSToken('&'),
                  openSpace: undefined,
                  name: makeSToken('geref2'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
               new TextPToken({ text: makeSToken('three') }),
            ];

            expect(pToken).toEqual(expected);
            done();
         });
      });

   });

});
