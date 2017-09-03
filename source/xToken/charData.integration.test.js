/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, ErrorCollector } from '../basic';
import { WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as charData from './charData.js';

describe('charData (integration)', () => {
   let expectedLToken;
   let emd;
   let source;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {
      it('parses up to a <', (done) => {
         source.addText('some text<foo>');

         charData.parse(source, (result) => {
            expect(result).toContainParsedProps({
               type: charData.TYPE,
               text: expectedLToken('some text'),
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
