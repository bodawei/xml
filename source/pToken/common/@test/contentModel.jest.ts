/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import {
   ContentModelP,
   isContentModelP,
   parseContentModel,
   resumeParseContentModel,
} from '../contentModel';

describe('ContentModel (unit)', () => {
   let contentSpec: ContentModelP;
   let result: ContentModelP | undefined;

   beforeEach(() => {
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  repeat: toSToken('*'),
                  repeatSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
            },
            {
               particle: {
                  name: toSToken('two'),
                  repeat: undefined,
                  repeatSpace: undefined,
                  nameSpace: undefined,
               },
               delimiter: undefined,
               delimiterSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
         repeat: undefined,
         repeatSpace: undefined,
      });
   });

   function getResult(item?: ContentModelP) {
      result = item;
   }

   describe('isContentModelP', () => {
      it('returns false if given a non-content model', () => {
         expect(isContentModelP({})).toEqual(false);
      });

      it('returns true if given a content model', () => {
         expect(isContentModelP(contentSpec)).toEqual(true);
      });
   });

   describe('construction', () => {
      it('returns simple instance given no parameter', () => {
         expect(new ContentModelP()).toMatchInlineSnapshot(`
            ContentModelP {
              "close": undefined,
              "closeSpace": undefined,
              "delimitedParticles": Array [],
              "open": undefined,
              "openSpace": undefined,
              "repeat": undefined,
              "repeatSpace": undefined,
            }
         `);
      });

      it('can override all properties with the second parameter', () => {
         const result = new ContentModelP(
            {
               open: toSToken('('),
               openSpace: toSToken(' '),
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        repeat: toSToken('*'),
                        repeatSpace: toSToken(' '),
                     },
                     delimiter: toSToken('|'),
                     delimiterSpace: toSToken(' '),
                  },
               ],
               close: toSToken(')'),
               closeSpace: undefined,
               repeat: undefined,
               repeatSpace: undefined,
            },
            {
               open: toSToken('1'),
               openSpace: toSToken('2'),
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('3'),
                        nameSpace: toSToken('4'),
                        repeat: toSToken('5'),
                        repeatSpace: toSToken('6'),
                     },
                     delimiter: toSToken('6'),
                     delimiterSpace: toSToken('7'),
                  },
               ],
               close: toSToken('8'),
               closeSpace: toSToken('9'),
               repeat: toSToken('10'),
               repeatSpace: toSToken('11'),
            },
         );

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('3'),
                     nameSpace: toSToken('4'),
                     repeat: toSToken('5'),
                     repeatSpace: toSToken('6'),
                  },
                  delimiter: toSToken('6'),
                  delimiterSpace: toSToken('7'),
               },
            ],
            close: toSToken('8'),
            closeSpace: toSToken('9'),
            repeat: toSToken('10'),
            repeatSpace: toSToken('11'),
         });
      });

      it('can override the delimitedParticles with an undefined', () => {
         const result = new ContentModelP(
            {
               open: toSToken('('),
               openSpace: toSToken(' '),
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        repeat: toSToken('*'),
                        repeatSpace: toSToken(' '),
                     },
                     delimiter: toSToken('|'),
                     delimiterSpace: toSToken(' '),
                  },
               ],
               close: toSToken(')'),
               closeSpace: undefined,
               repeat: undefined,
               repeatSpace: undefined,
            },
            {
               open: toSToken('1'),
               openSpace: toSToken('2'),
               delimitedParticles: undefined,
               close: toSToken('8'),
               closeSpace: toSToken('9'),
               repeat: toSToken('10'),
               repeatSpace: toSToken('11'),
            },
         );

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            delimitedParticles: [],
            close: toSToken('8'),
            closeSpace: toSToken('9'),
            repeat: toSToken('10'),
            repeatSpace: toSToken('11'),
         });
      });
   });

   describe('parseContentModel()', () => {
      it('parses a two name content spec', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            ['t', 'peekChar'],
            ['two', 'word', ['|', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(contentSpec);
      });

      it('parses a content spec with a space-padded repeat indicator', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            ['t', 'peekChar'],
            ['two', 'word', ['|', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [' ', 'space'],
            ['+', 'multi', ['?', '*', '+']],
            [' ', 'space'],
         ]);
         const expected = new ContentModelP(contentSpec, {
            closeSpace: toSToken(' '),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         });

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('parses a sequence spec when ANY passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [',', 'multi', ['|', ',']],
            [' ', 'space'],
            ['t', 'peekChar'],
            ['two', 'word', [',', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken(','),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     repeat: undefined,
                     repeatSpace: undefined,
                     nameSpace: undefined,
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
            ],
         });

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('chooses a choice spec based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            ['t', 'peekChar'],
            ['two', 'word', ['|', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(contentSpec);
      });

      it('chooses a sequnce list based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [',', 'multi', ['|', ',']],
            [' ', 'space'],
            ['t', 'peekChar'],
            ['two', 'word', [',', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken(','),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     repeat: undefined,
                     repeatSpace: undefined,
                     nameSpace: undefined,
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
            ],
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('parses a spec with two "|"', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            ['|', 'peekChar'],
            [undefined, 'word', ['|', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            ['|', 'multi', ['|']],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: undefined,
                     repeat: undefined,
                     repeatSpace: undefined,
                     nameSpace: undefined,
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: undefined,
               },
            ],
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('parses a content spec with two delimitedParticles and no "|"s', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            ['t', 'peekChar'],
            ['two', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            [')', 'peekChar'],
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
               {
                  particle: {
                     name: toSToken('two'),
                     repeat: undefined,
                     repeatSpace: undefined,
                     nameSpace: undefined,
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
            ],
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('parses nothing if it finds end of file', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBeUndefined();
      });

      it('parses nothing if it finds a "%"', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBeUndefined();
      });

      it('survives if no closing ")" found', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
               },
            ],
            close: undefined,
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('adds no entry if no name or "|" found', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [],
            close: undefined,
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('stops if ">" found', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            ['o', 'peekChar'],
            ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            ['>', 'peekChar'],
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         const expected = new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
               },
            ],
            close: undefined,
         });
         parseContentModel(mockSource, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      describe('nested', () => {
         it('parses a sequence list', () => {
            const mockSource = new MockSTokenSource([
               ['(', 'match', '('],
               [' ', 'space'],
               ['o', 'peekChar'],
               ['one', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['?', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               [',', 'multi', ['|', ',']],
               [' ', 'space'],
               ['(', 'peekChar'],
               ['(', 'match', '('],
               [' ', 'space'],
               ['t', 'peekChar'],
               ['two', 'word', ['|', ',', '%', ')', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['+', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               ['|', 'multi', ['|', ',']],
               [' ', 'space'],
               ['t', 'peekChar'],
               ['three', 'word', ['|', '%', ')', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['*', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               ['|', 'multi', ['|']],
               [' ', 'space'],
               [')', 'peekChar'],
               [')', 'match', ')'],
               undefined,
               undefined,
               undefined,
               [',', 'multi', [',']],
               [' ', 'space'],
               ['f', 'peekChar'],
               ['four', 'word', [',', '%', ')', '>', '?', '*', '+', '(']],
               [undefined, 'space'],
               [undefined, 'multi', ['?', '*', '+']],
               [undefined, 'space'],
               [undefined, 'multi'],
               [undefined, 'space'],
               [')', 'peekChar'],
               [')', 'match', ')'],
               undefined,
               undefined,
               undefined,
            ]);
            const expected = new ContentModelP(contentSpec, {
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        repeat: toSToken('?'),
                        repeatSpace: toSToken(' '),
                     },
                     delimiter: toSToken(','),
                     delimiterSpace: toSToken(' '),
                  },
                  {
                     particle: {
                        open: toSToken('('),
                        openSpace: toSToken(' '),
                        delimitedParticles: [
                           {
                              particle: {
                                 name: toSToken('two'),
                                 nameSpace: toSToken(' '),
                                 repeat: toSToken('+'),
                                 repeatSpace: toSToken(' '),
                              },
                              delimiter: toSToken('|'),
                              delimiterSpace: toSToken(' '),
                           },
                           {
                              particle: {
                                 name: toSToken('three'),
                                 nameSpace: toSToken(' '),
                                 repeat: toSToken('*'),
                                 repeatSpace: toSToken(' '),
                              },
                              delimiter: toSToken('|'),
                              delimiterSpace: toSToken(' '),
                           },
                        ],
                        close: toSToken(')'),
                     },
                     delimiter: toSToken(','),
                     delimiterSpace: toSToken(' '),
                  },
                  {
                     particle: {
                        name: toSToken('four'),
                        nameSpace: undefined,
                        repeat: undefined,
                        repeatSpace: undefined,
                     },
                     delimiter: undefined,
                     delimiterSpace: undefined,
                  },
               ],
               close: toSToken(')'),
            });

            parseContentModel(mockSource, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless(expected);
         });
      });
   });

   describe('resumeParseContentModel()', () => {
      it('resumes a parse after a topmost close', () => {
         const mockSource = new MockSTokenSource([
            ['+', 'multi', ['?', '*', '+']],
            [' ', 'space'],
         ]);
         contentSpec = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            delimitedParticles: [],
            close: toSToken(')'),
            closeSpace: toSToken(' '),
            repeat: undefined,
            repeatSpace: undefined,
         });
         const expected = new ContentModelP(contentSpec, {
            closeSpace: toSToken(' \t'),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         });

         resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(expected);
      });

      it('resumes a parse after a topmost content model is already done', () => {
         const mockSource = new MockSTokenSource([]);
         contentSpec = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            delimitedParticles: [],
            close: toSToken(')'),
            closeSpace: toSToken(' '),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         });

         resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(
            new ContentModelP(contentSpec, {
               repeatSpace: toSToken(' \t'),
            }),
         );
      });

      it('resumes parse with empty delimited particles', () => {
         const mockSource = new MockSTokenSource([
            ['p', 'peekChar'],
            ['p', 'word', ['|', ',', ')', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [undefined, 'multi'],
            [' ', 'space'],
            [undefined, 'peekChar'],
            [')', 'match', ')'],
            ['\n', 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         contentSpec = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            delimitedParticles: [],
         });

         resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(
            new ContentModelP(contentSpec, {
               openSpace: toSToken(' \t'),
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('p'),
                        nameSpace: toSToken(' '),
                        repeat: toSToken('*'),
                        repeatSpace: toSToken(' '),
                     },
                     delimiter: undefined,
                     delimiterSpace: toSToken(' '),
                  },
               ],
               close: toSToken(')'),
               closeSpace: toSToken('\n'),
               repeat: undefined,
               repeatSpace: undefined,
            }),
         );
      });

      it('resumes parse with an empty delimited particle', () => {
         const mockSource = new MockSTokenSource([
            [')', 'peekChar'],
            [')', 'match', ')'],
            ['\n', 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         contentSpec = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            delimitedParticles: [{}], // This can't happen for real
         });

         resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(
            new ContentModelP(contentSpec, {
               openSpace: toSToken(' \t'),
               delimitedParticles: [{}],
               close: toSToken(')'),
               closeSpace: toSToken('\n'),
               repeat: undefined,
               repeatSpace: undefined,
            }),
         );
      });

      it('resumes a parse after a mid-content name particle', () => {
         const mockSource = new MockSTokenSource([
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [undefined, 'multi'],
            [' ', 'space'],
            [undefined, 'peekChar'],
            [')', 'match', ')'],
            ['\n', 'space'],
            ['+', 'multi', ['?', '*', '+']],
            [' ', 'space'],
         ]);
         contentSpec = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('a'),
                     nameSpace: toSToken(' '),
                  },
               },
            ],
         });

         resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(
            new ContentModelP(contentSpec, {
               delimitedParticles: [
                  {
                     particle: {
                        name: toSToken('a'),
                        nameSpace: toSToken(' \t'),
                        repeat: toSToken('*'),
                        repeatSpace: toSToken(' '),
                     },
                     delimiter: undefined,
                     delimiterSpace: toSToken(' '),
                  },
               ],
               close: toSToken(')'),
               closeSpace: toSToken('\n'),
               repeat: toSToken('+'),
               repeatSpace: toSToken(' '),
            }),
         );
      });
   });

   it('resumes a parse after a particle boundary', () => {
      const mockSource = new MockSTokenSource([
         ['b', 'peekChar'],
         ['b', 'word', ['|', ')', '>', '?', '*', '+', '(']],
         [' ', 'space'],
         ['+', 'multi', ['?', '*', '+']],
         [' ', 'space'],
         [undefined, 'multi'],
         [undefined, 'space'],
         [undefined, 'peekChar'],
         [')', 'match', ')'],
         ['\n', 'space'],
         ['+', 'multi', ['?', '*', '+']],
         [' ', 'space'],
      ]);
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  name: toSToken('a'),
                  nameSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
            },
         ],
      });

      resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
      mockSource.respondInAsyncTime();

      // @ts-expect-error 2329/matchers
      expect(result).toEqualRangeless(
         new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('a'),
                     nameSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken('\t'),
               },
               {
                  particle: {
                     name: toSToken('b'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('+'),
                     repeatSpace: toSToken(' '),
                  },
               },
            ],
            close: toSToken(')'),
            closeSpace: toSToken('\n'),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         }),
      );
   });

   it('resumes a parse with a second partial token', () => {
      const mockSource = new MockSTokenSource([
         ['+', 'multi', ['?', '*', '+']],
         [' ', 'space'],
         [undefined, 'multi'],
         [undefined, 'space'],
         [undefined, 'peekChar'],
         [')', 'match', ')'],
         ['\n', 'space'],
         ['+', 'multi', ['?', '*', '+']],
         [' ', 'space'],
      ]);
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  name: toSToken('a'),
                  nameSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
            },
            {
               particle: {
                  name: toSToken('b'),
               },
            },
         ],
      });

      resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
      mockSource.respondInAsyncTime();

      // @ts-expect-error 2329/matchers
      expect(result).toEqualRangeless(
         new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('a'),
                     nameSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('b'),
                     nameSpace: toSToken('\t'),
                     repeat: toSToken('+'),
                     repeatSpace: toSToken(' '),
                  },
               },
            ],
            close: toSToken(')'),
            closeSpace: toSToken('\n'),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         }),
      );
   });

   it('resumes a parse with a partial content model', () => {
      const mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [')', 'match', ')'],
         ['\n', 'space'],
         ['+', 'multi', ['?', '*', '+']],
         [' ', 'space'],
         [undefined, 'multi'], // delimiter
         [undefined, 'space'],
         [undefined, 'peekChar'],
         [')', 'match', ')'],
         [undefined, 'space'],
         ['?', 'multi', ['?', '*', '+']],
         [undefined, 'space'],
      ]);
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  open: toSToken('('),
                  openSpace: toSToken(' '),
               },
            },
         ],
      });

      resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
      mockSource.respondInAsyncTime();

      // @ts-expect-error 2329/matchers
      expect(result).toEqualRangeless(
         new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     open: toSToken('('),
                     openSpace: toSToken(' \t'),
                     delimitedParticles: [],
                     close: toSToken(')'),
                     closeSpace: toSToken('\n'),
                     repeat: toSToken('+'),
                     repeatSpace: toSToken(' '),
                  },
               },
            ],
            close: toSToken(')'),
            repeat: toSToken('?'),
         }),
      );
   });

   it('resumes a parse with a complete content model', () => {
      const mockSource = new MockSTokenSource([
         [')', 'peekChar'],
         [')', 'match', ')'],
         [undefined, 'space'],
         ['?', 'multi', ['?', '*', '+']],
         [undefined, 'space'],
      ]);
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  open: toSToken('('),
                  openSpace: toSToken(' '),
                  close: toSToken(')'),
                  repeat: toSToken('+'),
               },
            },
         ],
      });

      resumeParseContentModel(mockSource, contentSpec, toSToken('\t'), getResult);
      mockSource.respondInAsyncTime();

      // @ts-expect-error 2329/matchers
      expect(result).toEqualRangeless(
         new ContentModelP(contentSpec, {
            delimitedParticles: [
               {
                  particle: {
                     open: toSToken('('),
                     openSpace: toSToken(' '),
                     close: toSToken(')'),
                     repeat: toSToken('+'),
                  },
                  delimiterSpace: toSToken('\t'),
               },
            ],
            close: toSToken(')'),
            repeat: toSToken('?'),
         }),
      );
   });
});
