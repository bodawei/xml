/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { Range, EntityId } from 'basic';
import { SToken, toSToken } from 'sToken';
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
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
            },
         ],
         close: toSToken('?>'),
      });
   });

   describe('parseFieldedInstruction()', () => {
      let callback: jasmine.Spy;
      let litParse: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
      });

      it('does a basic parsing', () => {
         litParse.and.callFake((_1, _2, cb: () => void) => {
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

         const args = litParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            pToken: {
               name: new SToken(
                  'version',
                  'version',
                  new Range(new EntityId(), 7, 0, 7, 14, 0, 14),
               ),
               nameSpace: undefined,
               equal: new SToken('=', '=', new Range(new EntityId(), 14, 0, 14, 15, 0, 15)),
               equalSpace: undefined,
            },
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('parses multiple attributes', () => {
         let calls = 0;
         expected = new FieldedInstruction(expected, {
            fields: [
               {
                  name: toSToken('version'),
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  valueSpace: toSToken(' '),
               },
               {
                  name: toSToken('encoding'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
               },
            ],
         });
         litParse.and.callFake((_1, _2, cb: (result?: any) => void) => {
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

         expect(callback).toEqualRangeless(expected);
      });

      it('parses zero fields', () => {
         expected = new FieldedInstruction(expected, {
            fields: [],
         });
         litParse.and.callFake((_1, _2, cb: () => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [undefined, 'peekWord', ['=', '?>']],
            ['?>', 'match', '?>'],
         ]);

         parseFieldedInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

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
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
               },
            ],
            close: undefined,
         });
         litParse.and.callFake((_1, _2, cb: () => void) => {
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

         expect(callback).toEqualRangeless(expected);
      });
   });
});
