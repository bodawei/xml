/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from '../../../error/index';
import { defaultExtractors } from '../../../extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import literalValue from '../literalValue';
import text from '../../text';
import { GeneralEntityReferencePToken, GeneralEntityReferenceXToken } from 'source/token/generalEntityReference';
import { ParameterEntityReferencePToken } from 'source/token/parameterEntityReference';
import { CharRefPToken } from 'source/token/charRef';

describe('literalValue (integration)', () => {
   let emd: EntityMetaData;
   let source: STokenSource;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {

      it('ignores PE and GE References if not told to attend to them', (done) => {
         source.addText('one%peref;two&geref;&geref2;three"');
         source.endText();

         literalValue.parse(source, ['"'], (pToken) => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual([
               new text.PToken({ text: makeSToken('one%peref;two&geref;&geref2;three') }),
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
               new text.PToken({ text: makeSToken('one') }),
               new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: undefined,
                  name: makeSToken('peref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
               new CharRefPToken({
                  open: makeSToken('&#'),
                  postOpenSpace: undefined,
                  postHexMarkerSpace: undefined,
                  digits: makeSToken('32'),
                  postDigitsSpace: undefined,
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
               new text.PToken({ text: makeSToken('three') }),
            ]);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error if the value has a bad character (misc.checkWellFormedText())', (done) => {
         source.addText('b\u0000d"');
         source.endText();
         literalValue.parse(source, ['"'], (pToken) => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalValue.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error if an entity reference is malformed', (done) => {
         source.addText('good& bad;"');
         source.endText();
         literalValue.parse(source, ['"', '&'], (pToken) => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalValue.checkWellFormed(pToken, ec, emd);

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
            const pToken1 = new text.PToken({ text: makeSToken('one') });
            const pTokenRef = new GeneralEntityReferencePToken({
               open: makeSToken('&'),
               openSpace: undefined,
               name: makeSToken('ref'),
               nameSpace: undefined,
               close: makeSToken(';'),
            });
            const pToken2 = new text.PToken({ text: makeSToken('two') });

            expect(results).toEqual([
               new text.XToken('one', pToken1),
               new GeneralEntityReferenceXToken('ref', pTokenRef),
               new text.XToken('two', pToken2),
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
