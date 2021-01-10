/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { WellFormedError } from '../../../error/index';
import { TextPToken } from 'pToken';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { GeneralEntityReferencePToken } from 'token';
import { GeneralEntityReferenceXToken, TextXToken } from 'xToken';

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

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let confVer: ConformanceVersion;
      let litValCheckWFSpy: jasmine.Spy;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         confVer = new ConformanceVersion();
         litValCheckWFSpy = spyOn(literalValue, 'checkWellFormed');
      });

      it('calls literalValue.checkWellFormed() to check the value', () => {
         literal.checkWellFormed(literalPToken, mockErrorCollector, confVer, 'foo');

         expect(litValCheckWFSpy.calls.argsFor(0)[0]).toEqual(literalPToken.value);
         expect(litValCheckWFSpy.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(litValCheckWFSpy.calls.argsFor(0)[2]).toEqual(confVer);
      });

      it('reports an error if there is no opening quote', () => {
         delete literalPToken.openQuote;

         literal.checkWellFormed(literalPToken, mockErrorCollector, confVer, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.LITERAL_NO_OPEN_QUOTE,
            params: [ 'aType' ],
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no close quote', () => {
         delete literalPToken.closeQuote;

         literal.checkWellFormed(literalPToken, mockErrorCollector, confVer, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE,
            params: [ 'aType' ],
            lastPosition: literalPToken.openQuote,
         });
      });

   });

   describe('makeTokenCompatible()', () => {
      let litValMakeCompatSpy: jasmine.Spy;

      beforeEach(() => {
         litValMakeCompatSpy = spyOn(literalValue, 'makeXTokenCompatible')
            .and.returnValue([]);
      });

      it('calls literalValue.makeXTokenCompatible()', () => {
         literal.makeTokenCompatible(literalPToken);

         expect(litValMakeCompatSpy).toHaveBeenCalledWith(literalPToken.value);
      });

      it('copes with no quoted value at all', () => {
         delete (literalPToken as any).value;
         const result = literal.makeTokenCompatible(literalPToken);

         expect(result).toEqual(undefined);
      });

      it('copes with no pToken at all', () => {
         const result = literal.makeTokenCompatible();

         expect(result).toEqual(undefined);
      });

   });

   describe('makeOneTokenCompatible()', () => {
      let litValMakeCompatSpy: jasmine.Spy;

      beforeEach(() => {
         litValMakeCompatSpy = spyOn(literalValue, 'makeXTokenCompatible')
            .and.returnValue([]);
      });

      it('returns the string from the PToken result', () => {
         litValMakeCompatSpy.and.returnValue([ new TextXToken(new TextPToken({ text: SToken.fromString('xxx') })) ])
         const result = literal.makeOneTokenCompatible(literalPToken);

         expect(result).toEqual('xxx');
      });

      it('copes with no quoted value at all', () => {
         litValMakeCompatSpy.and.returnValue([]);
         const result = literal.makeOneTokenCompatible(literalPToken);

         expect(result).toEqual(undefined);
      });

      it('copes the value being an entity reference', () => {
         litValMakeCompatSpy.and.returnValue([ new GeneralEntityReferenceXToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') })) ]);
         const result = literal.makeOneTokenCompatible(literalPToken);

         expect(result).toEqual(undefined);
      });

   });

   describe('getSTokens()', () => {
      let litValGetSTokens: jasmine.Spy;

      beforeEach(() => {
         litValGetSTokens = spyOn(literalValue, 'getSTokens')
            .and.returnValue([]);
      });

      it('calls literalValue.getSTokens()', () => {
         const results = literal.getSTokens(literalPToken);

         expect(literalValue.getSTokens).toHaveBeenCalledWith(literalPToken.value);
      });

      it('does a basic population', () => {
         litValGetSTokens.and.returnValue(SToken.fromString('value'));
         const results = literal.getSTokens(literalPToken);

         expect(results).toEqual([
            literalPToken.openQuote as SToken,
            SToken.fromString('value'),
            literalPToken.closeQuote as SToken,
         ]);
      });

      it('does not add the quotes if they are not there', () => {
         litValGetSTokens.and.returnValue(SToken.fromString('value'));
         delete literalPToken.openQuote;
         delete literalPToken.closeQuote;
         const results = literal.getSTokens(literalPToken);

         expect(results).toEqual([
            SToken.fromString('value'),
         ]);
      });

      it('adds nothing if the PToken value is undefined', () => {
         const results = literal.getSTokens(undefined);

         expect(results).toEqual([]);
      });

   });
});
