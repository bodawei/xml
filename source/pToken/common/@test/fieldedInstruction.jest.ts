/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { parseFieldedInstruction, FieldedInstruction } from '../fieldedInstruction';
import { InstructionStart } from '../../bridge/instruction';

import literal from '../../../token/common/literal';

describe('FieldedInstruction (unit)', () => {
   let expected: FieldedInstruction;
   let start: InstructionStart;
   let legalParams: Array<string>;

   beforeEach(() => {
      legalParams = ['version', 'encoding', 'standalone'];
      start = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      };
      expected = new FieldedInstruction({
         ...start,
         fields: [
            {
               name: toSToken('version'),
               openQuote: undefined,
               closeQuote: undefined,
               valueSpace: undefined,
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
            },
         ],
         close: toSToken('?>'),
      });
   });

   describe('construction()', () => {
      it('clones the provided FieldedIntruction', () => {
         const source = expected;
         const result = new FieldedInstruction(source);

         expect(result).toEqual(source);
         expect(result).not.toBe(source);
      });

      it('overrides the properties wof the base FieldedInstruction', () => {
         const source = expected;
         const result = new FieldedInstruction(source, {
            open: toSToken('1'),
            close: toSToken('2'),
            openSpace: toSToken('3'),
            target: toSToken('4'),
            targetSpace: toSToken('5'),
            fields: [
               {
                  name: toSToken('6'),
                  openQuote: toSToken('7'),
                  closeQuote: toSToken('8'),
                  valueSpace: toSToken('9'),
                  nameSpace: toSToken('10'),
                  equal: toSToken('11'),
                  equalSpace: toSToken('12'),
               },
            ],
         });

         expect(result).toEqual(
            new FieldedInstruction({
               open: toSToken('1'),
               close: toSToken('2'),
               openSpace: toSToken('3'),
               target: toSToken('4'),
               targetSpace: toSToken('5'),
               fields: [
                  {
                     name: toSToken('6'),
                     openQuote: toSToken('7'),
                     closeQuote: toSToken('8'),
                     valueSpace: toSToken('9'),
                     nameSpace: toSToken('10'),
                     equal: toSToken('11'),
                     equalSpace: toSToken('12'),
                  },
               ],
            }),
         );
      });

      it('assures fields is an empty array, even when other provides an undefined value', () => {
         const source = expected;
         const result = new FieldedInstruction(source, {
            open: toSToken('1'),
            close: toSToken('2'),
            openSpace: toSToken('3'),
            target: toSToken('4'),
            targetSpace: toSToken('5'),
            fields: undefined,
         });

         expect(result).toEqual(
            new FieldedInstruction({
               open: toSToken('1'),
               close: toSToken('2'),
               openSpace: toSToken('3'),
               target: toSToken('4'),
               targetSpace: toSToken('5'),
               fields: [],
            }),
         );
      });
   });

   describe('parseFieldedInstruction()', () => {
      let callback: jest.MockedFunction<(result: FieldedInstruction) => void>;
      let litParse: jest.MockedFunction<typeof literal.parse>;

      beforeEach(() => {
         callback = jest.fn();
         litParse = jest.spyOn(literal, 'parse').mockImplementation() as jest.MockedFunction<
            typeof literal.parse
         >;
      });

      it('does a basic parsing', () => {
         litParse.mockImplementation((_1, _2, cb: () => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            ['version', 'peekWord', ['=', '?>']],
            ['version', 'word', ['=', '?>']],
            [undefined, 'space'],
            ['=', 'match', '='],
            [undefined, 'space'],
            [undefined, 'peekWord', ['=', '?>']],
            ['?>', 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(callback).toEqualRangeless(expected);
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockSTokenSource([
            ['version', 'peekWord', ['=', '?>']],
            ['version', 'word', ['=', '?>']],
            [undefined, 'space'],
            ['=', 'match', '='],
            [undefined, 'space'],
            [undefined, 'peekWord', ['=', '?>']],
            ['?>', 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, { open: toSToken('<?') }, legalParams, callback);
         mockSource.respondInAsyncTime();

         const args = litParse.mock.calls[0];
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toBeUndefined();
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('parses multiple attributes', () => {
         let calls = 0;
         expected = new FieldedInstruction(expected, {
            fields: [
               {
                  name: toSToken('version'),
                  openQuote: undefined,
                  closeQuote: undefined,
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  valueSpace: toSToken(' '),
               },
               {
                  name: toSToken('encoding'),
                  openQuote: undefined,
                  closeQuote: undefined,
                  valueSpace: undefined,
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
               },
            ],
         });
         litParse.mockImplementation((_1, _2, cb: (result?: any) => void) => {
            calls++;
            cb(calls === 1 ? { value: [] } : undefined);
         });
         const mockSource = new MockSTokenSource([
            ['version', 'peekWord', ['=', '?>']],
            ['version', 'word', ['=', '?>']],
            [undefined, 'space'],
            ['=', 'match', '='],
            [undefined, 'space'],
            [' ', 'space'],
            ['encoding', 'peekWord', ['=', '?>']],
            ['encoding', 'word', ['=', '?>']],
            [' ', 'space'],
            ['=', 'match', '='],
            [' ', 'space'],
            [undefined, 'peekWord', ['=', '?>']],
            ['?>', 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(callback).toEqualRangeless(expected);
      });

      it('parses zero fields', () => {
         expected = new FieldedInstruction(expected, {
            fields: [],
         });
         litParse.mockImplementation((_1, _2, cb: () => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [undefined, 'peekWord', ['=', '?>']],
            ['?>', 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(callback).toEqualRangeless(expected);
      });

      it('stops parsing if an unexpected field name is found', () => {
         expected = new FieldedInstruction({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  openQuote: undefined,
                  closeQuote: undefined,
                  valueSpace: undefined,
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
               },
            ],
            close: undefined,
         });
         litParse.mockImplementation((_1, _2, cb: () => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            ['version', 'peekWord', ['=', '?>']],
            ['version', 'word', ['=', '?>']],
            [undefined, 'space'],
            ['=', 'match', '='],
            [undefined, 'space'],
            ['bogus', 'peekWord', ['=', '?>']],
            [undefined, 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(callback).toEqualRangeless(expected);
      });
   });
});
