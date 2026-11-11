/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { Range, EntityId } from 'basic';
import { SToken } from 'basic';
import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { makeSTokenMaker, MockSTokenSource } from 'pToken-test';

import * as charRef from '../../../pToken/token/charRef';
import * as generalEntityReference from '../../../pToken/token/generalEntityReference';
import * as parameterEntityReference from '../../../pToken/token/parameterEntityReference';
import literalValue, { LiteralValuePToken } from '../literalValue';

describe('literalValue (unit)', () => {
   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let value: LiteralValuePToken;
      let callback: (result: LiteralValuePToken) => void;
      let expectedSToken: (value: string) => SToken;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         callback = (result: LiteralValuePToken) => (value = result);
      });

      it('does a basic parse', () => {
         mockSource = new MockSTokenSource(['blah', MockSTokenSource.PEEK('"')]);

         literalValue.parse(mockSource, ['"'], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([new TextPToken({ text: expectedSToken('blah') })]);
      });

      it('returns an empty array result if there is an EOF', () => {
         mockSource = new MockSTokenSource([undefined, undefined]);

         literalValue.parse(mockSource, ['"'], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([]);
      });

      it('returns a partial result if there is an EOF after first chunk of text', () => {
         mockSource = new MockSTokenSource(['some text', undefined]);

         literalValue.parse(mockSource, ['"'], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([new TextPToken({ text: expectedSToken('some text') })]);
      });

      it('returns an empty array result if there is no text before the close quote', () => {
         mockSource = new MockSTokenSource([undefined, MockSTokenSource.PEEK('"')]);

         literalValue.parse(mockSource, ['"'], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([]);
      });

      describe('entity references', () => {
         let generalParseSpy: jasmine.Spy;
         let paramParseSpy: jasmine.Spy;
         let charRefSpy: jasmine.Spy;

         beforeEach(() => {
            generalParseSpy = spyOn(generalEntityReference, 'parseGeneralEntityReference');
            paramParseSpy = spyOn(parameterEntityReference, 'parseParameterEntityReference');
            charRefSpy = spyOn(charRef, 'parseCharRef');
         });

         it('calls out to parseParameterEntityReference() when encountering a % and asked to parse peRefs', () => {
            mockSource = new MockSTokenSource([undefined, MockSTokenSource.PEEK('%')]);

            literalValue.parse(mockSource, ['"', '%'], callback);
            mockSource.respondInAsyncTime();

            expect(paramParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(typeof paramParseSpy.calls.argsFor(0)[1]).toEqual('function');
         });

         it('calls out to parseGeneralEntityReference() when encountering a & and asked to parse geRefs', () => {
            mockSource = new MockSTokenSource([undefined, MockSTokenSource.PEEK('&'), '&']);

            literalValue.parse(mockSource, ['"', '&'], callback);
            mockSource.respondInAsyncTime();

            expect(generalParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(generalParseSpy.calls.argsFor(0)[1]).toEqual(
               new SToken('&', '&', new Range(new EntityId(), 0, 0, 0, 1, 0, 1)),
            );
            expect(typeof generalParseSpy.calls.argsFor(0)[2]).toEqual('function');
         });

         it('calls out to charRef.parse() when encountering a &# and asked to parse charRefs', () => {
            mockSource = new MockSTokenSource([
               undefined,
               MockSTokenSource.PEEK('&'),
               ['&#', 'multi', ['&', '&#']],
            ]);

            literalValue.parse(mockSource, ['"', '&', '&#'], callback);
            mockSource.respondInAsyncTime();

            expect(charRefSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(charRefSpy.calls.argsFor(0)[1]).toEqual(
               new SToken('&#', '&#', new Range(new EntityId(), 0, 0, 0, 2, 0, 2)),
            );
            expect(typeof charRefSpy.calls.argsFor(0)[2]).toEqual('function');
         });

         it('handles a combination of text, pe and ge refs', () => {
            generalParseSpy.and.callFake((_1: any, _2: any, callback: (entityRef: any) => void) => {
               callback({});
            });
            paramParseSpy.and.callFake((_1: any, callback: (entityRef: any) => void) => {
               callback({});
            });
            mockSource = new MockSTokenSource([
               'one',
               MockSTokenSource.PEEK('&'),
               '&',
               'two',
               MockSTokenSource.PEEK('%'),
               'three',
               MockSTokenSource.PEEK('%'),
               'four',
               MockSTokenSource.PEEK('"'),
            ]);

            literalValue.parse(mockSource, ['"', '&', '%'], callback);
            mockSource.respondInAsyncTime();

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 4, 0, 4);
            expect(value).toEqual([
               new TextPToken({ text: makeSToken('one') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('two') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('three') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('four') }),
            ]);
         });
      });
   });
});
