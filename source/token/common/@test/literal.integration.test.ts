/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { WellFormedError, ErrorCollector } from '../../../error/index';
import { defaultExtractors } from '../../../extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import literal, { LiteralPToken } from '../literal';
import { ParameterEntityReferencePToken } from '../../parameterEntityReference';
import { GeneralEntityReferencePToken } from '../../generalEntityReference';
import { TextPToken, TextXToken } from 'source/token/text';
import { GeneralEntityReferenceXToken } from 'xToken';

describe('literal (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
   });

   describe('parse()', () => {

      it('ignores PE and GE References if not told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            pToken: pToken,
         }, () => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual({
               openQuote: makeSToken('"'),
               value: [
                  new TextPToken({ text: makeSToken('one%peref;two&geref;&geref2;three') }),
               ],
               closeQuote: makeSToken('"'),
            });
            done();
         });
      });

      it('parses PE and GE References when told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            pToken: pToken,
            peRef: true,
            geRef: true,
         }, () => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual({
               openQuote: makeSToken('"'),
               value: [
                  new TextPToken({ text: makeSToken('one') }),
                  new ParameterEntityReferencePToken({
                     open: makeSToken('%'),
                     openSpace: undefined,
                     name: makeSToken('peref'),
                     nameSpace: undefined,
                     close: makeSToken(';'),
                  }),
                  new TextPToken({ text: makeSToken('two') }),
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
               ],
               closeQuote: makeSToken('"'),
            });
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error if the value has a bad character (misc.checkCharWellFormed())', (done) => {
         const pToken: LiteralPToken = {} as  LiteralPToken;
         source.addText('"b\u0000d"');
         source.endText();
         literal.parse(source, {
            pToken: pToken,
         }, () => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literal.checkWellFormed(pToken, ec, confVer, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error if an entity reference is malformed', (done) => {
         const pToken: LiteralPToken = {} as  LiteralPToken;
         source.addText('"good& bad;"');
         source.endText();
         literal.parse(source, {
            pToken: pToken,
            geRef: true,
         }, () => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literal.checkWellFormed(pToken, ec, confVer, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
            done();
         });
      });

   });

   describe('makeTokenCompatible()', () => {

      it('converts intput PToken into a set of XTokens', (done) => {
         const pToken: LiteralPToken = {} as  LiteralPToken;
         source.addText('"one&ref;two"');
         source.endText();
         literal.parse(source, {
            pToken: pToken,
            geRef: true,
         }, () => {
            const results = literal.makeTokenCompatible(pToken);
            const makeSToken = makeSTokenMaker();
            makeSToken('"');
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
               new TextXToken('one', pToken1),
               new GeneralEntityReferenceXToken(pTokenRef),
               new TextXToken('two', pToken2),
            ]);
            done();
         });
      });

      describe('makeOneTokenCompatible()', () => {

         it('converts intput PToken into a single string', (done) => {
            const pToken: LiteralPToken = {} as  LiteralPToken;
            source.addText('"one"');
            source.endText();
            literal.parse(source, {
               pToken: pToken,
               geRef: true,
            }, () => {
               const results = literal.makeOneTokenCompatible(pToken);

               expect(results).toEqual('one');
               done();
            });
         });

      });

   });

});
