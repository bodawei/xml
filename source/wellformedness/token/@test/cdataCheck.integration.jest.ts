/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import { parseCdata, SectionStart } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { cdataCheck } from '../cdataCheck';

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
         const ec = new ErrorCollector(toSToken('<!['), WellFormedError);

         cdataCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });

   it('reports an error a bad character is in the text (checks charCheck())', (done) => {
      const source = new STokenSource();
      source.addText('[bad\u0000&]]>');
      source.endText();

      parseCdata(source, sectionStart, (pToken) => {
         const ec = new ErrorCollector(pToken.open, WellFormedError);

         cdataCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
