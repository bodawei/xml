/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ErrorCollector } from 'basic';
import { WellFormedError } from '../../../wellformedness/error/WellFormedError';
import { defaultExtractors } from 'extractor';
import { TextPToken } from 'pToken';
import { SToken, STokenSource, toSToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { ParameterEntityReferencePToken,  } from 'token';

import { UnassignedType } from '../unassigned';
import { ExternalId, parseExternalId, checkExternalIdWellFormed, getSTokens } from '../externalId';
import { ConformanceVersion } from 'basic';

describe('externalId (integration)', () => {
   describe('parse()', () => {
      let source: STokenSource;

      beforeEach(() => {
         source = new STokenSource(defaultExtractors);
      });

      it('parses the public and system value (check literal.parse())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');

         parseExternalId(source, [], false, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result.externalId).toEqual({
               type: 'EXTERNAL_ID',
               externalType: makeSToken('PUBLIC'),
               externalTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('pub.xml') })],
                  closeQuote: makeSToken('"'),
               },
               publicSpace: makeSToken('\t'),
               system: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('sys.xml') })],
                  closeQuote: makeSToken('"'),
               },
            });
            done();
         });
      });

      it('parses a PERef (check unsasigned calls)', (done) => {
         source.addText('PUBLIC "pub.xml"%foo;>');

         parseExternalId(source, [], true, (result) => {
            const makeSToken = makeSTokenMaker();
            const expected: ExternalId = {
               type: 'EXTERNAL_ID',
               externalType: makeSToken('PUBLIC'),
               externalTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('pub.xml') })],
                  closeQuote: makeSToken('"'),
               },
               publicSpace: undefined,
               system: undefined,
            };

            expect(result).toEqual({
               externalId: expected,
               peRefPlus: [
                  {
                     type: UnassignedType.REFERENCE,
                     token: new ParameterEntityReferencePToken({
                        open: makeSToken('%'),
                        openSpace: undefined,
                        name: makeSToken('foo'),
                        nameSpace: undefined,
                        close: makeSToken(';'),
                     }),
                  },
               ],
               nextPropName: 'system',
            });
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {
      let source: STokenSource;

      beforeEach(() => {
         source = new STokenSource(defaultExtractors);
      });

      it('reports an error when the SYSTEM is missing a quote (check literal.checkCharWellFormed())', (done) => {
         source.addText('SYSTEM "bad');
         source.endText();
         parseExternalId(source, [], true, (result) => {
            const ec = new ErrorCollector(toSToken('x'), WellFormedError);

            checkExternalIdWellFormed(result.externalId, ec, new ConformanceVersion());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });
   });

   describe('getSTokens()', () => {
      let source: STokenSource;

      beforeEach(() => {
         source = new STokenSource(defaultExtractors);
      });

      it('adds all tokens (check literal.getSTokens())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');
         parseExternalId(source, [], false, (result) => {
            const results = getSTokens(result.externalId);

            const makeSToken = makeSTokenMaker();
            expect(results).toEqual([
               makeSToken('PUBLIC'),
               makeSToken(' '),
               makeSToken('"'),
               makeSToken('pub.xml'),
               makeSToken('"'),
               makeSToken('\t'),
               makeSToken('"'),
               makeSToken('sys.xml'),
               makeSToken('"'),
            ]);
            done();
         });
      });
   });
});
