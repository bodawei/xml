/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as charData from '../charData.js';

describe('charData (integration)', () => {
   let emd;
   let source;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {
      it('parses up to a <', (done) => {
         const expectedSToken = makeSTokenMaker();
         const expected = new charData.PToken({
            text: expectedSToken('some text'),
         });
         source.addText('some text<foo>');

         charData.parse(source, (result) => {
            expect(result).toEqual(expected);
            done();
         });
      });

      it('parses up to a the specified terminator', (done) => {
         const expectedSToken = makeSTokenMaker();
         const expected = new charData.PToken({
            text: expectedSToken('some textfoo'),
         });
         source.addText('some textfoo#>');

         charData.parse(source, [ '#' ], (result) => {
            expect(result).toEqual(expected);
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {

      it('reports an error a bad character is in the text', (done) => {
         source.addText('bad\u0000&');
         source.endText();

         charData.parse(source, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            charData.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
