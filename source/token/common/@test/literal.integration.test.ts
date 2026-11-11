/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { STokenSource } from 'basic';
import { GeneralEntityReferencePToken, ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { makeSTokenMaker } from 'pToken-test';

import literal, { LiteralPToken } from '../literal';

describe('literal (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   describe('parse()', () => {
      it('ignores PE and GE References if not told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(
            source,
            {
               pToken: pToken,
            },
            () => {
               const makeSToken = makeSTokenMaker();
               expect(pToken).toEqual({
                  openQuote: makeSToken('"'),
                  value: [
                     new TextPToken({ text: makeSToken('one%peref;two&geref;&geref2;three') }),
                  ],
                  closeQuote: makeSToken('"'),
               });
               done();
            },
         );
      });

      it('parses PE and GE References when told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(
            source,
            {
               pToken: pToken,
               peRef: true,
               geRef: true,
            },
            () => {
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
            },
         );
      });
   });
});
