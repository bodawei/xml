/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { GeneralEntityEndPToken, GeneralEntityStartPToken } from 'token';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { attributeLangCheck } from '../attributeLangCheck';

const WFEID = wellFormedErrorCodes.id;

describe('attributeLangCheck (unit)', () => {
   let confVer10_1: ConformanceVersion;
   let confVer: ConformanceVersion;
   let collector: ParamCollector;

   beforeEach(() => {
      collector = new ParamCollector();
      confVer10_1 = new ConformanceVersion(1, 1);
      confVer = new ConformanceVersion();
   });

   it('reports no errors on an empty attribute value', () => {
      attributeLangCheck([], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors on an attribute value that has no problems', () => {
      attributeLangCheck([new TextPToken({ text: toSToken('wh') })], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('allows for a value to be broken up across strings', () => {
      attributeLangCheck(
         [new TextPToken({ text: toSToken('w') }), new TextPToken({ text: toSToken('h') })],
         collector,
         confVer,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors on an attribute value that has entity start and end values', () => {
      attributeLangCheck(
         [
            new GeneralEntityStartPToken(new GeneralEntityReferencePToken({ open: toSToken('&') })),
            new TextPToken({ text: toSToken('wh') }),
            new GeneralEntityEndPToken(new GeneralEntityReferencePToken({ open: toSToken('&') })),
         ],
         collector,
         confVer,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if the attribute value is not a proper language code', () => {
      const textToken = new TextPToken({ text: toSToken('99') });

      attributeLangCheck([textToken], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
         lastPosition: undefined,
         params: ['99'],
         position: textToken.text,
      });
   });

   it('does no checks if there are unexpanded references in the value', () => {
      const textToken = new TextPToken({ text: toSToken('99') });
      const refToken = new GeneralEntityReferencePToken({ open: toSToken('&') });

      attributeLangCheck([textToken, refToken], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors with an empty value if rev >= 3', () => {
      attributeLangCheck([new TextPToken({ text: toSToken('') })], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an errors with an empty value if rev < 3', () => {
      const textToken = new TextPToken({ text: toSToken('') });

      attributeLangCheck([textToken], collector, new ConformanceVersion(1.0, 2));

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
         lastPosition: undefined,
         params: [''],
         position: textToken.text,
      });
   });

   it('reports an errors with a completely value if rev < 3', () => {
      attributeLangCheck([], collector, new ConformanceVersion(1.0, 2));

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
         lastPosition: undefined,
         params: [''],
         position: undefined,
      });
   });

   it('allows technically invalid grandfathered values (§2.12.0)', () => {
      const textToken = new TextPToken({ text: toSToken('i-qwe-qwe-qwe') });

      attributeLangCheck([textToken], collector, new ConformanceVersion(1.0, 2));

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('allows technically invalid private use values (§2.12.0)', () => {
      const textToken = new TextPToken({
         text: toSToken('x-onetwothree-fourfive-muchmuchtoo-long'),
      });

      attributeLangCheck([textToken], collector, new ConformanceVersion(1.0, 2));

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if the value is irregular or grandfathered but still grossly wrong', () => {
      const textToken = new TextPToken({ text: toSToken('i-asdf---oops') });

      attributeLangCheck([textToken], collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
         lastPosition: undefined,
         params: ['i-asdf---oops'],
         position: textToken.text,
      });
   });

   describe('in 1.0/1', () => {
      it('allows en as a code', () => {
         const textToken = new TextPToken({ text: toSToken('en') });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('allows "x-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: toSToken('x-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('allows "X-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: toSToken('X-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('allows "i-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: toSToken('i-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('allows "I-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: toSToken('I-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('allows "zh-blah-blah" as a code', () => {
         const textToken = new TextPToken({
            text: toSToken('zh-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz'),
         });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error with a three letter langcode', () => {
         const textToken = new TextPToken({ text: toSToken('abc') });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
            lastPosition: undefined,
            params: ['abc'],
            position: textToken.text,
         });
      });

      it('reports an error with a six letter langcode split across multiple ptokens', () => {
         const textToken1 = new TextPToken({ text: toSToken('abc') });
         const textToken2 = new TextPToken({ text: toSToken('def') });

         attributeLangCheck([textToken1, textToken2], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
            lastPosition: undefined,
            params: ['abcdef'],
            position: textToken1.text,
         });
      });

      it('reports an error with a one letter langcode', () => {
         const textToken = new TextPToken({ text: toSToken('A') });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
            lastPosition: undefined,
            params: ['A'],
            position: textToken.text,
         });
      });

      it('reports an error with a letter+digit letter langcode', () => {
         const textToken = new TextPToken({ text: toSToken('e9') });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
            lastPosition: undefined,
            params: ['e9'],
            position: textToken.text,
         });
      });

      it('reports an error with an empty subcode', () => {
         const textToken = new TextPToken({ text: toSToken('en-') });

         attributeLangCheck([textToken], collector, confVer10_1);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_LANG_BAD_CODE,
            lastPosition: undefined,
            params: ['en-'],
            position: textToken.text,
         });
      });
   });
});
