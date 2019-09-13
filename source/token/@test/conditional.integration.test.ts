/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { ConditionalPToken, parseConditional } from '../conditional';
import { SectionStart } from '../bridge/section';

const { fromString } = SToken;

describe('conditional (integration)', () => {
   let emd: EntityMetaData;
   let source: STokenSource;
   let sectionStart: SectionStart;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
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
            ignored: [
               fromString('blah'),
               fromString('<!['),
               fromString('two'),
               fromString('<!['),
               fromString('three'),
               fromString(']]>'),
               fromString('four'),
               fromString(']]>'),
            ],
            close: fromString(']]>'),
         });
         source.addText('[blah<![two<![three]]>four]]>]]>');

         parseConditional(source, sectionStart, (result) => {
            expect(result).toEqualRangeless(expected);
            done();
         });
      });
   });

});
