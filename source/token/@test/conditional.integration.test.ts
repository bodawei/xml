/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { STokenSource, SToken, toSToken } from 'sToken';

import { ConditionalStartPToken, parseConditional, resumeParseConditional } from '../conditionalStart';
import { SectionStart } from '../bridge/section';
import { ParameterEntityReferencePToken } from 'pToken';

describe('conditional (integration)', () => {
   let source: STokenSource;
   let sectionStart: SectionStart;

   beforeEach(() => {
      source = new STokenSource();
      sectionStart = {
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
      };
   });

   describe('parse()', () => {
      it('parses an IGNORE with embedded values', (done) => {
         const expected = new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: toSToken('IGNORE'),
            bracket: toSToken('['),
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
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
               propName: 'sectionType',
            }
         });
         const expected = new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken('  '),
            sectionType: toSToken('blah'),
            sectionTypeSpace: toSToken(' '),
            bracket: toSToken('['),
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
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('blah'),
            sectionTypeSpace: toSToken(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%')}),
               propName: 'sectionType',
               secondPropName: 'bracket',
            }
         });
         source.addText('\t[<![two<![three]]>four]]>]]>');

         resumeParseConditional(source, start, (result) => {
            expect(result).toEqualRangeless(new ConditionalStartPToken({
               open: toSToken('<!['),
               openSpace: toSToken(' '),
               sectionType: toSToken('blah'),
               sectionTypeSpace: toSToken(' \t'),
               bracket: toSToken('['),
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
