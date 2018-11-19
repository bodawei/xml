/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as misc from '../misc';
import { parseEntityInstruction, EntityInstruction, sTokensFromPToken } from '../entityInstruction';
import { InstructionStart } from '../../bridge/instruction';
import literal from '../literal';

describe('EntityDecl (unit)', () => {
   let entityInstr: EntityInstruction;
   let start: InstructionStart;
   let legalParams: Array<string>;

   beforeEach(() => {
      legalParams = [ 'version', 'encoding', 'standalone' ];
      entityInstr = new EntityInstruction({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         params: [{
            name: SToken.fromString('version'),
            nameSpace: undefined,
            equal: SToken.fromString('='),
            equalSpace: undefined,
         }],
         close: SToken.fromString('?>'),
      });

      start = {
         open: entityInstr.open,
         openSpace: undefined,
         target: entityInstr.target,
         targetSpace: entityInstr.targetSpace,
      };
   });

   describe('parseEntityInstruction()', () => {
      let callback: jasmine.Spy;
      let litParse: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
      });

      it('does a basic parsing', () => {
         litParse.and.callFake((_1: any, _2: any, cb:() => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseEntityInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(entityInstr);
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseEntityInstruction(mockSource, {} as InstructionStart, legalParams, callback);
         mockSource.respondInAsyncTime();

         const args = litParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            pToken: {
               name: new SToken('version', 'version', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
               nameSpace: undefined,
               equal: new SToken('=', '=', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
               equalSpace: undefined,
            },
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('parses multiple attributes', () => {
         let calls = 0;
         (entityInstr.params[0].valueSpace as any) = SToken.fromString(' ');
         (entityInstr.params as any).push({
            name: SToken.fromString('encoding'),
            nameSpace: SToken.fromString(' '),
            equal: SToken.fromString('='),
            equalSpace: SToken.fromString(' '),
         });
         litParse.and.callFake((_1: any, _2: any, cb:(result?: any) => void) => {
            calls ++;
            cb(calls === 1 ? { value: [] } : undefined);
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ ' ', 'space' ],
            [ 'encoding', 'peekWord', ['=', '?>'] ],
            [ 'encoding', 'word', ['=', '?>'] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseEntityInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(entityInstr);
      });

      it('parses zero parameters', () => {
         (entityInstr.params as any).pop();
         litParse.and.callFake((_1: any, _2: any, cb:() => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseEntityInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(entityInstr);
      });

      it('stops parsing if an unexpected parameter is found', () => {
         (entityInstr as any).close = undefined;
         litParse.and.callFake((_1: any, _2: any, cb:(result?: any) => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ 'bogus', 'peekWord', ['=', '?>'] ],
            [ undefined, 'match', '?>' ],
         ]);

         parseEntityInstruction(mockSource, start, legalParams, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(entityInstr);
      });

   });

   describe('sTokensFromPToken()', () => {
      let entityInstr: EntityInstruction;

      it('extracts all the STokens', () => {
         entityInstr = new EntityInstruction({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: SToken.fromString('1.2'),
               closeQuote: SToken.fromString('"'),
               valueSpace: SToken.fromString(' '),
            }, {
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('some-encoding'),
            }, {
               name: SToken.fromString('standalone'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('YES'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = sTokensFromPToken(entityInstr);

         expect(result).toEqual([
            entityInstr.open,
            entityInstr.openSpace,
            entityInstr.target,
            entityInstr.targetSpace,
            entityInstr.params[0].name,
            entityInstr.params[0].nameSpace,
            entityInstr.params[0].equal,
            entityInstr.params[0].equalSpace,
            entityInstr.params[0].openQuote,
            entityInstr.params[0].value,
            entityInstr.params[0].closeQuote,
            entityInstr.params[0].valueSpace,
            entityInstr.params[1].name,
            entityInstr.params[1].nameSpace,
            entityInstr.params[1].equal,
            entityInstr.params[1].equalSpace,
            entityInstr.params[1].value,
            entityInstr.params[2].name,
            entityInstr.params[2].nameSpace,
            entityInstr.params[2].equal,
            entityInstr.params[2].equalSpace,
            entityInstr.params[2].value,
            entityInstr.close,
         ] as any);
      });

   });
});
