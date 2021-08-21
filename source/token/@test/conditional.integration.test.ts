/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { STokenSource, SToken, toSToken } from 'sToken';

import { ConditionalStartPToken, parseConditional, resumeParseConditional } from '../conditionalStart';
import { SectionStart } from '../bridge/section';
import { ParameterEntityReferencePToken } from 'pToken';

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
         const expected = new ConditionalStartPToken({
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

   describe('resumeParseConditional()', () => {
      it('adds section type and bracket', (done) => {
         const start = new ConditionalStartPToken({
            open: fromString('<!['),
            openSpace: fromString(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
               propName: 'sectionType',
            }
         });
         const expected = new ConditionalStartPToken({
            open: fromString('<!['),
            openSpace: fromString('  '),
            sectionType: fromString('blah'),
            sectionTypeSpace: fromString(' '),
            bracket: fromString('['),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
               propName: 'sectionType',
            }
         });
         source.addText(' blah [<![two<![three]]>four]]>]]>');

         resumeParseConditional(source, start, (result) => {
            expect(result).toEqualRangeless(expected);
            done();
         });
      });

      it('adds bracket', (done) => {
         const start = new ConditionalStartPToken({
            open: fromString('<!['),
            openSpace: fromString(' '),
            sectionType: fromString('blah'),
            sectionTypeSpace: fromString(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
               propName: 'sectionType',
               secondPropName: 'bracket',
            }
         });
         source.addText('\t[<![two<![three]]>four]]>]]>');

         resumeParseConditional(source, start, (result) => {
            expect(result).toEqualRangeless(new ConditionalStartPToken({
               open: fromString('<!['),
               openSpace: fromString(' '),
               sectionType: fromString('blah'),
               sectionTypeSpace: fromString(' \t'),
               bracket: fromString('['),
               unexpanded: {
                  peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
                  propName: 'sectionType',
                  secondPropName: 'bracket',
               }
            }));
            done();
         });
      });
   });

});
