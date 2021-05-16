/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { TextPToken } from 'pToken';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import literal, { LiteralPToken } from '../literal';
import literalValue, { LiteralValuePToken } from '../literalValue';

type LiteralValueCallback = (value: LiteralValuePToken) => void;

describe('literal (unit)', () => {
   let literalPToken: LiteralPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      literalPToken = {
         type: 'foo',
         openQuote: expectedSToken('"'),
         value: [ new TextPToken({ text: expectedSToken('xxx') }) ],
         closeQuote: expectedSToken('"'),
      };
   });

   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let litCallback: jasmine.Spy;
      let valueParseSpy: jasmine.Spy;
      let textPToken: TextPToken;

      beforeEach(() => {
         litCallback = jasmine.createSpy('callbackSpy');
         textPToken = new TextPToken({ text: SToken.fromString('test') });
         valueParseSpy = spyOn(literalValue, 'parse')
         valueParseSpy.and.callFake((_1: any, _2: any, callback: LiteralValueCallback) => callback([ textPToken ]));
      });

      it('does a basic parse', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            // literalValue parsed here
            '"',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, litCallback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(litCallback.calls.allArgs()).toEqual([ [ container ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ textPToken ],
            closeQuote: expectedSToken('"'),
         });
      });

      it('acepts single quotes', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '\'',
            // literalValue parsed here
            '\'',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, litCallback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(litCallback.calls.allArgs()).toEqual([ [ container ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('\''),
            value: [ textPToken ],
            closeQuote: expectedSToken('\''),
         });
      });

      it('returns an empty result if there is an EOF after the first quote', () => {
         const container = {};
         valueParseSpy.and.callFake((_1: any, _2: any, callback: LiteralValueCallback) => callback([]));
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            undefined,
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, litCallback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(litCallback.calls.allArgs()).toEqual([ [ container ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ ],
            closeQuote: undefined,
         });
      });

      it('returns a partial result if there is an EOF after first chunk of text', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            undefined,
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, litCallback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(litCallback.calls.allArgs()).toEqual([ [ container ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ textPToken ],
            closeQuote: undefined,
         });
      });

      it('provides an empty value if there is nothing between the quotes', () => {
         valueParseSpy.and.callFake((_1: any, _2: any, callback: LiteralValueCallback) => callback([]));
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            '"',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, litCallback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ ],
            closeQuote: expectedSToken('"'),
         });
      });

   });

   
});
