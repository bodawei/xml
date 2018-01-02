/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import entityReference from '../entityReference.js';
import text from '../text.js';
import externalId from './externalId.js';

describe('externalId (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('parses the public and system value (check literal.parse())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');

         externalId.parse(source, [], (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual({
               type: 'EXTERNAL_ID',
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: makeSToken('\t'),
               system: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('sys.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
            });
            done();
         });
      });

      it('parses a PERef (check usp.parse())', (done) => {
         source.addText('PUBLIC "pub.xml"%foo;>');

         externalId.parse(source, [], (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual({
               type: 'EXTERNAL_ID',
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: undefined,
               incomplete: [ new entityReference.ParamPToken({
                  type: 'foo',
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               leftOff: 'system',
            });
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('reports an error when the SYSTEM is missing a quote (check literal.checkWellFormedText())', (done) => {
         source.addText('SYSTEM "bad');
         source.endText();
         externalId.parse(source, [], (result) => {
            const ec = new ErrorCollector({}, WellFormedError);

            externalId.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

   });

   describe('getSTokens()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('adds all tokens (check literal.getSTokens())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');
         externalId.parse(source, [], (pToken) => {
            const results = externalId.getSTokens(pToken);

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
