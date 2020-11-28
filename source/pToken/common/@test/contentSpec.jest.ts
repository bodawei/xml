/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { ContentSpecP, parseContentSpec } from '../contentSpec';

describe('nameList (unit)', () => {
   let contentSpec: ContentSpecP;

   beforeEach(() => {
      contentSpec = new ContentSpecP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         names: [
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

   describe('construction', () => {
      it('can override all properties with the second parameter', () => {
         const result = new ContentSpecP(
            {
               open: toSToken('('),
               openSpace: toSToken(' '),
               names: [
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
               names: [
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

         expect(result).toEqualRangeless({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            names: [
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

      it('can override the names with an undefined', () => {
         const result = new ContentSpecP(
            {
               open: toSToken('('),
               openSpace: toSToken(' '),
               names: [
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
               names: undefined,
               close: toSToken('8'),
               closeSpace: toSToken('9'),
               repeat: toSToken('10'),
               repeatSpace: toSToken('11'),
            },
         );

         expect(result).toEqualRangeless({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            names: [],
            close: toSToken('8'),
            closeSpace: toSToken('9'),
            repeat: toSToken('10'),
            repeatSpace: toSToken('11'),
         });
      });
   });

   describe('parseContentSpec()', () => {
      let result: ContentSpecP | undefined;

      function getResult(item?: ContentSpecP) {
         result = item;
      }

      it('parses a two name content spec', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', ['|', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(contentSpec);
      });

      it('parses a content spec with a space-padded repeat indicator', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', ['|', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [' ', 'space'],
            ['+', 'multi', ['?', '*', '+']],
            [' ', 'space'],
         ]);
         const expected = new ContentSpecP(contentSpec, {
            closeSpace: toSToken(' '),
            repeat: toSToken('+'),
            repeatSpace: toSToken(' '),
         });

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('parses a sequence spec when ANY passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [',', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', [',', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentSpecP(contentSpec, {
            names: [
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

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('chooses a choice spec based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', ['|', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(contentSpec);
      });

      it('chooses a sequnce list based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [',', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', [',', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentSpecP(contentSpec, {
            names: [
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
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('parses a spec with two "|"', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('|'),
            [undefined, 'word', ['|', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            ['|', 'multi', ['|']],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentSpecP(contentSpec, {
            names: [
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
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('parses a content spec with two names and no "|"s', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK('t'),
            ['two', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
            [undefined, 'multi'],
            [undefined, 'space'],
            MockSTokenSource.PEEK(')'),
            [')', 'match', ')'],
            [undefined, 'space'],
            [undefined, 'multi', ['?', '*', '+']],
            [undefined, 'space'],
         ]);
         const expected = new ContentSpecP(contentSpec, {
            names: [
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
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('parses nothing if it finds end of file', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBeUndefined();
      });

      it('parses nothing if it finds a "%"', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBeUndefined();
      });

      it('survives if no closing ")" found', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
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
         const expected = new ContentSpecP(contentSpec, {
            names: [
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
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

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
         const expected = new ContentSpecP(contentSpec, {
            names: [],
            close: undefined,
         });
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      it('stops if ">" found', () => {
         const mockSource = new MockSTokenSource([
            ['(', 'match', '('],
            [' ', 'space'],
            MockSTokenSource.PEEK('o'),
            ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
            [' ', 'space'],
            ['*', 'multi', ['?', '*', '+']],
            [' ', 'space'],
            ['|', 'multi', ['|', ',']],
            [' ', 'space'],
            MockSTokenSource.PEEK('>'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         const expected = new ContentSpecP(contentSpec, {
            names: [
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
         parseContentSpec(mockSource, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(expected);
      });

      describe('nested', () => {
         it('parses a sequence list', () => {
            const mockSource = new MockSTokenSource([
               ['(', 'match', '('],
               [' ', 'space'],
               MockSTokenSource.PEEK('o'),
               ['one', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['?', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               [',', 'multi', ['|', ',']],
               [' ', 'space'],
               MockSTokenSource.PEEK('('),
               ['(', 'match', '('],
               [' ', 'space'],
               MockSTokenSource.PEEK('t'),
               ['two', 'word', ['|', ',', ')', '%', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['+', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               ['|', 'multi', ['|', ',']],
               [' ', 'space'],
               MockSTokenSource.PEEK('t'),
               ['three', 'word', ['|', ')', '%', '>', '?', '*', '+', '(']],
               [' ', 'space'],
               ['*', 'multi', ['?', '*', '+']],
               [' ', 'space'],
               ['|', 'multi', ['|']],
               [' ', 'space'],
               MockSTokenSource.PEEK(')'),
               [')', 'match', ')'],
               undefined,
               undefined,
               undefined,
               [',', 'multi', [',']],
               [' ', 'space'],
               MockSTokenSource.PEEK('f'),
               ['four', 'word', [',', ')', '%', '>', '?', '*', '+', '(']],
               [undefined, 'space'],
               [undefined, 'multi', ['?', '*', '+']],
               [undefined, 'space'],
               [undefined, 'multi'],
               [undefined, 'space'],
               MockSTokenSource.PEEK(')'),
               [')', 'match', ')'],
               undefined,
               undefined,
               undefined,
            ]);
            const expected = new ContentSpecP(contentSpec, {
               names: [
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
                        names: [
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

            parseContentSpec(mockSource, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless(expected);
         });
      });
   });
});

// remove peeks
// need to check constructio
