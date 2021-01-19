/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion, ErrorCollector, Range, EntityId } from 'basic';
import {  WellFormedError } from '../../wellformedness/error/WellFormedError';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { parseCdata, CdataPToken } from '../cdata';
import { SectionStart } from '../bridge/section';

describe('cdata (integration)', () => {
   let source: STokenSource;
   let sectionStart: SectionStart;
   let cDataPToken: CdataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();

      source = new STokenSource(defaultExtractors);

      sectionStart =  {
         open: expectedSToken('<!['),
         sectionType: expectedSToken('CDATA'),
      };
      cDataPToken = new CdataPToken({
         open: sectionStart.open,
         sectionType: sectionStart.sectionType,
         bracket: expectedSToken('['),
         text: expectedSToken('some text<foo>'),
         close: expectedSToken(']]>'),
      });
   });

   describe('parse()', () => {

      it('parses up to the ]]>', (done) => {
         source.addText('[some text<foo>]]>other', new Range(new EntityId(), 8, 0, 8));

         parseCdata(source, sectionStart, (result) => {
            expect(result).toEqual(cDataPToken);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports error if type has an invalid character type', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('[F\u0000xx[');
         source.endText();

         parseCdata(source, sectionStart, (pToken) => {
            const ec = new ErrorCollector(SToken.fromString('<!['), WellFormedError);

            pToken.checkWellFormed(ec, new ConformanceVersion());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error a bad character is in the text (checks misc.checkCharWellFormed())', (done) => {
         source.addText('[bad\u0000&]]>');
         source.endText();

         parseCdata(source, sectionStart, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            pToken.checkWellFormed(ec, new ConformanceVersion());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
