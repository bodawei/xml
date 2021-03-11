/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion, ErrorCollector, Range, EntityId } from 'basic';
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

});
