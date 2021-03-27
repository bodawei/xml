/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { STokenSource, SToken } from 'sToken';

import { ConditionalPToken, parseConditional } from '../conditional';
import { SectionStart } from '../bridge/section';

const { fromString } = SToken;

describe('conditional (integration)', () => {
   let source: STokenSource;
   let sectionStart: SectionStart;

   beforeEach(() => {
      source = new STokenSource();
      sectionStart = {
         open: fromString('<!['),
         sectionType: fromString('IGNORE'),
      };
   });

   describe('parse()', () => {
      it('parses an IGNORE with embedded values', (done) => {
         const expected = new ConditionalPToken({
            open: fromString('<!['),
            sectionType: fromString('IGNORE'),
            bracket: fromString('['),
         });
         source.addText('[blah<![two<![three]]>four]]>]]>');

         parseConditional(source, sectionStart, (result) => {
            expect(result).toEqualRangeless(expected);
            done();
         });
      });
   });

});
