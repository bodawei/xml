/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { toSToken, STokenSource } from 'basic';
import { parseCdata, SectionStart } from 'token';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { cdataCheck } from '../cdataCheck';

const WFEID = wellFormedErrorCodes.id;

describe('cdataCheck() (integration)', () => {
   let sectionStart: SectionStart;

   beforeEach(() => {
      sectionStart = {
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
      };
   });

   it('reports error if type has an invalid character type', (done) => {
      const source = new STokenSource();
      source.addText('[F\u0000xx[');
      source.endText();

      parseCdata(source, sectionStart, (pToken) => {
         const collector = new ProblemCollector(toSToken('<!['), WellFormedError);

         cdataCheck(pToken, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });

   it('reports an error a bad character is in the text (checks charCheck())', (done) => {
      const source = new STokenSource();
      source.addText('[bad\u0000&]]>');
      source.endText();

      parseCdata(source, sectionStart, (pToken) => {
         const collector = new ProblemCollector(pToken.open, WellFormedError);

         cdataCheck(pToken, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
