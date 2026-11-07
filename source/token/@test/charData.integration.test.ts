/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion,  } from 'basic';
import { STokenSource } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import { CharDataPToken, parseCharData } from '../charData';
// import * as charData from '../charData';

describe('charData (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
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

});
