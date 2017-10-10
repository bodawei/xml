/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as charData from './charData.js';

describe('charData (integration)', () => {
   let emd;
   let source;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {
      it('parses up to a <', (done) => {
         const expectedLToken = makeLTokenMaker();
         source.addText('some text<foo>');

         charData.parse(source, (result) => {
            expect(result).toEqual({
               type: charData.TYPE,
               text: expectedLToken('some text'),
            });
            done();
         });
      });

      it('parses up to a the specified terminator', (done) => {
         const expectedLToken = makeLTokenMaker();
         source.addText('some textfoo#>');

         charData.parse(source, [ '#' ], (result) => {
            expect(result).toEqual({
               type: charData.TYPE,
               text: expectedLToken('some textfoo'),
            });
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {

      it('reports an error a bad character is in the text', (done) => {
         source.addText('bad\u0000&');
         source.endText();

         charData.parse(source, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            charData.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
