/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion, ErrorCollector,  } from 'basic';
import {  WellFormedError } from '../../wellformedness/error/WellFormedError';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { CharDataPToken, CharDataXToken, parseCharData } from '../charData';
// import * as charData from '../charData';

describe('charData (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
   });

   describe('parse()', () => {
      it('parses up to a <', (done) => {
         const expectedSToken = makeSTokenMaker();
         const expected = new CharDataPToken({
            text: expectedSToken('some text'),
         });
         source.addText('some text<foo>');

         parseCharData(source, [], (result) => {
            expect(result).toEqual(expected);
            done();
         });
      });

      it('parses up to a the specified terminator', (done) => {
         const expectedSToken = makeSTokenMaker();
         const expected = new CharDataPToken({
            text: expectedSToken('some textfoo'),
         });
         source.addText('some textfoo#>');

         parseCharData(source, [ '#' ], (result) => {
            expect(result).toEqual(expected);
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {

      it('reports an error a bad character is in the text', (done) => {
         source.addText('bad\u0000&');
         source.endText();

         parseCharData(source, [], (result) => {
            const pToken = result as CharDataPToken;
            const ec = new ErrorCollector(pToken!.text, WellFormedError);

            pToken!.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
