/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion } from 'basic';
import { WellFormedError } from 'wellformedness';
import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { SToken } from 'sToken';
import { GeneralEntityEndPToken, GeneralEntityStartPToken } from 'token';

import { attributeLangCheck } from '../attributeLangCheck';

describe('langAttribute (unit)', () => {
   let startSToken: SToken;
   let confVer10_1: ConformanceVersion;
   let confVer: ConformanceVersion;
   let ec: ErrorCollector;

   beforeEach(() => {
      startSToken = SToken.fromString('x');
      ec = new ErrorCollector(startSToken, WellFormedError);
      confVer10_1 = new ConformanceVersion(1, 1);
      confVer = new ConformanceVersion();
   });

   it('reports no errors on an empty attribute value', () => {
      attributeLangCheck([], ec, confVer);

      expect(ec.errors.length).toEqual(0);
   });

   it('reports no errors on an attribute value that has no problems', () => {
      attributeLangCheck([new TextPToken({ text: SToken.fromString('wh') })], ec, confVer);

      expect(ec.errors.length).toEqual(0);
   });

   it('allows for a value to be broken up across strings', () => {
      attributeLangCheck(
         [
            new TextPToken({ text: SToken.fromString('w') }),
            new TextPToken({ text: SToken.fromString('h') }),
         ],
         ec,
         confVer,
      );

      expect(ec.errors.length).toEqual(0);
   });

   it('reports no errors on an attribute value that has entity start and end values', () => {
      attributeLangCheck(
         [
            new GeneralEntityStartPToken(
               new GeneralEntityReferencePToken({ open: SToken.fromString('&') }),
            ),
            new TextPToken({ text: SToken.fromString('wh') }),
            new GeneralEntityEndPToken(
               new GeneralEntityReferencePToken({ open: SToken.fromString('&') }),
            ),
         ],
         ec,
         confVer,
      );

      expect(ec.errors.length).toEqual(0);
   });

   it('reports an error if the attribute value is not a proper language code', () => {
      const textToken = new TextPToken({ text: SToken.fromString('99') });
      const expected = new WellFormedError(
         WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
         ['99'],
         textToken.text,
         textToken.text,
      );

      attributeLangCheck([textToken], ec, confVer);

      expect(ec.errors).toEqual([expected]);
   });

   it('does no checks if there are unexpanded references in the value', () => {
      const textToken = new TextPToken({ text: SToken.fromString('99') });
      const refToken = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });

      attributeLangCheck([textToken, refToken], ec, confVer);

      expect(ec.errors.length).toEqual(0);
   });

   it('reports no errors with an empty value if rev >= 3', () => {
      attributeLangCheck([new TextPToken({ text: SToken.fromString('') })], ec, confVer);

      expect(ec.errors.length).toEqual(0);
   });

   it('reports an errors with an empty value if rev < 3', () => {
      const textToken = new TextPToken({ text: SToken.fromString('') });
      const expected = new WellFormedError(
         WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
         [''],
         textToken.text,
         textToken.text,
      );

      attributeLangCheck([textToken], ec, new ConformanceVersion(1.0, 2));

      expect(ec.errors).toEqual([expected]);
   });

   it('reports an errors with a completely value if rev < 3', () => {
      const expected = new WellFormedError(
         WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
         [''],
         startSToken,
         startSToken,
      );

      attributeLangCheck([], ec, new ConformanceVersion(1.0, 2));

      expect(ec.errors).toEqual([expected]);
   });

   it('allows technically invalid grandfathered values (§2.12.0)', () => {
      const textToken = new TextPToken({ text: SToken.fromString('i-qwe-qwe-qwe') });

      attributeLangCheck([textToken], ec, new ConformanceVersion(1.0, 2));

      expect(ec.errors).toEqual([]);
   });

   it('allows technically invalid private use values (§2.12.0)', () => {
      const textToken = new TextPToken({
         text: SToken.fromString('x-onetwothree-fourfive-muchmuchtoo-long'),
      });

      attributeLangCheck([textToken], ec, new ConformanceVersion(1.0, 2));

      expect(ec.errors).toEqual([]);
   });

   it('reports an error if the value is irregular or grandfathered but still grossly wrong', () => {
      const textToken = new TextPToken({ text: SToken.fromString('i-asdf---oops') });
      const expected = new WellFormedError(
         WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
         ['i-asdf---oops'],
         textToken.text,
         textToken.text,
      );

      attributeLangCheck([textToken], ec, confVer);

      expect(ec.errors).toEqual([expected]);
   });

   describe('in 1.0/1', () => {
      it('allows en as a code', () => {
         const textToken = new TextPToken({ text: SToken.fromString('en') });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows "x-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: SToken.fromString('x-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows "X-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: SToken.fromString('X-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows "i-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: SToken.fromString('i-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows "I-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: SToken.fromString('I-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows "zh-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: SToken.fromString('zh-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports an error with a three letter langcode', () => {
         const textToken = new TextPToken({ text: SToken.fromString('abc') });
         const expected = new WellFormedError(
            WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            ['abc'],
            textToken.text,
            textToken.text,
         );

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors).toEqual([expected]);
      });

      it('reports an error with a six letter langcode split across multiple ptokens', () => {
         const textToken1 = new TextPToken({ text: SToken.fromString('abc') });
         const textToken2 = new TextPToken({ text: SToken.fromString('def') });
         const expected = new WellFormedError(
            WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            ['abcdef'],
            textToken1.text,
            textToken1.text,
         );

         attributeLangCheck([textToken1, textToken2], ec, confVer10_1);

         expect(ec.errors).toEqual([expected]);
      });

      it('reports an error with a one letter langcode', () => {
         const textToken = new TextPToken({ text: SToken.fromString('A') });
         const expected = new WellFormedError(
            WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            ['A'],
            textToken.text,
            textToken.text,
         );

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors).toEqual([expected]);
      });

      it('reports an error with a letter+digit letter langcode', () => {
         const textToken = new TextPToken({ text: SToken.fromString('e9') });
         const expected = new WellFormedError(
            WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            ['e9'],
            textToken.text,
            textToken.text,
         );

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors).toEqual([expected]);
      });

      it('reports an error with an empty subcode', () => {
         const textToken = new TextPToken({ text: SToken.fromString('en-') });
         const expected = new WellFormedError(
            WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            ['en-'],
            textToken.text,
            textToken.text,
         );

         attributeLangCheck([textToken], ec, confVer10_1);

         expect(ec.errors).toEqual([expected]);
      });
   });
});
