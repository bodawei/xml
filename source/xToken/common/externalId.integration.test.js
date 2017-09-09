/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { LTokenSource, defaultExtractors } from '../../lToken';
import { makeLTokenMaker } from '../../lToken/test';

import * as externalId from './externalId.js';

describe('externalId (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('parses the public and system value (check quotedValue.parse())', (done) => {

         source.addText('PUBLIC "pub.xml"\t"sys.xml">');
         externalId.parse(source, [], (result) => {

            const makeLToken = makeLTokenMaker();
            expect(result).toEqual({
               type: 'EXTERNAL_ID',
               idType: makeLToken('PUBLIC'),
               postIdTypeSpace: makeLToken(' '),
               publicOpenQuote: makeLToken('"'),
               publicValue: makeLToken('pub.xml'),
               publicCloseQuote: makeLToken('"'),
               postPublicSpace: makeLToken('\t'),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
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
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports an error when the SYSTEM is missing a quote (check quotedValue.checkWellFormedText())', (done) => {
         source.addText('SYSTEM "bad');
         source.endText();
         externalId.parse(source, [], (result) => {
            const ec = new ErrorCollector({}, WellFormedError);

            externalId.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.QUOTEDVALUE_NO_CLOSE_QUOTE);
            done();
         });
      });

   });

   describe('appendLTokens()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('adds all tokens (check quotedValue.appendLTokens())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');
         externalId.parse(source, [], (parsed) => {
            const results = [];

            externalId.appendLTokens(results, parsed);

            const makeLToken = makeLTokenMaker();
            expect(results).toEqual([
               makeLToken('PUBLIC'),
               makeLToken(' '),
               makeLToken('"'),
               makeLToken('pub.xml'),
               makeLToken('"'),
               makeLToken('\t'),
               makeLToken('"'),
               makeLToken('sys.xml'),
               makeLToken('"'),
            ]);
            done();
         });
      });

   });

});
