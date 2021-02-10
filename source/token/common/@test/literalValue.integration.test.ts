/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ErrorCollector,  } from 'basic';
import { WellFormedError } from '../../../wellformedness/error/WellFormedError';
import { defaultExtractors } from '../../../extractor';
import { ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { TextXToken,  } from 'xToken';

import literalValue from '../literalValue';
import { GeneralEntityReferencePToken } from '../../generalEntityReference';
import { CharRefPToken } from '../../charRef';
import { GeneralEntityReferenceXToken } from 'xToken';
import { ConformanceVersion } from 'basic';

describe('literalValue (integration)', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
   });

   describe('parse()', () => {

      it('ignores PE and GE References if not told to attend to them', (done) => {
         source.addText('one%peref;two&geref;&geref2;three"');
         source.endText();

         literalValue.parse(source, ['"'], (pToken) => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual([
               new TextPToken({ text: makeSToken('one%peref;two&geref;&geref2;three') }),
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
            expect(pToken).toEqual([
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
            ]);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error if the value has a bad character (misc.checkCharWellFormed())', (done) => {
         source.addText('b\u0000d"');
         source.endText();
         literalValue.parse(source, ['"'], (pToken) => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalValue.checkWellFormed(pToken, ec, new ConformanceVersion());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error if an entity reference is malformed', (done) => {
         source.addText('good& bad;"');
         source.endText();
         literalValue.parse(source, ['"', '&'], (pToken) => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalValue.checkWellFormed(pToken, ec, new ConformanceVersion());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
            done();
         });
      });

   });

   describe('makeTokenCompatible()', () => {

      it('converts intput PToken into a set of XTokens', (done) => {
         source.addText('one&ref;two"');
         source.endText();
         literalValue.parse(source, ['"', '&'], (pToken) => {
            const results = literalValue.makeXTokenCompatible(pToken);
            const makeSToken = makeSTokenMaker();
            const pToken1 = new TextPToken({ text: makeSToken('one') });
            const pTokenRef = new GeneralEntityReferencePToken({
               open: makeSToken('&'),
               openSpace: undefined,
               name: makeSToken('ref'),
               nameSpace: undefined,
               close: makeSToken(';'),
            });
            const pToken2 = new TextPToken({ text: makeSToken('two') });

            expect(results).toEqual([
               new TextXToken(pToken1),
               new GeneralEntityReferenceXToken(pTokenRef),
               new TextXToken(pToken2),
            ]);
            done();
         });
      });

   });

   describe('getSTokens()', () => {

      it('converts intput PToken into an array of STokens', (done) => {
         source.addText('one&two;"');
         source.endText();
         literalValue.parse(source, ['"', '&'], (pToken) => {
            const results = literalValue.getSTokens(pToken);
            const makeSToken = makeSTokenMaker();

            expect(results).toEqual([
               makeSToken('one'),
               makeSToken('&'),
               makeSToken('two'),
               makeSToken(';'),
            ]);
            done();
         });
      });

   });

});
