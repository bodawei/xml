/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Range, EntityId } from 'basic';
import { SToken, STokenSource } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import { parseCdata, CdataPToken } from '../cdata';
import { SectionStart } from '../bridge/section';

describe('cdata (integration)', () => {
   let source: STokenSource;
   let sectionStart: SectionStart;
   let cDataPToken: CdataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();

      source = new STokenSource();

      sectionStart = {
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
