/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from 'pToken-test';

import attribute from '../attribute';
import literal from '../literal';

describe('attribute (unit)', () => {
   let attributesPChunk: any;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      attributesPChunk = [ {
         name: expectedSToken('version'),
         postNameSpace: expectedSToken(' '),
         equal: expectedSToken('='),
         postEqualSpace: expectedSToken(' '),
         value: [],
         trailingSpace: expectedSToken(' '),
      }, {
         name: expectedSToken('another'),
         postNameSpace: undefined,
         equal: expectedSToken('='),
         postEqualSpace: undefined,
         value: [],
         trailingSpace: undefined,
      } ];
   });

   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;
      let litParse: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
         litParse.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
      });

      it('parses an attribute', () => {
         mockSource = new MockSTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);
         attributesPChunk.pop();

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

      it('calls literal.parse() with appropriate parameters', () => {
         mockSource = new MockSTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);
         attributesPChunk.pop();

         attribute.parse(mockSource, { geRef: true, terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(litParse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(litParse.calls.argsFor(0)[1].geRef).toEqual(true);
         expect(typeof litParse.calls.argsFor(0)[2]).toEqual('function');
      });

      it('parses multiple attributes', () => {
         mockSource = new MockSTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ 'another', 'word', [ '=', '>' ] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

      it('accepts no options', () => {
         mockSource = new MockSTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);
         attributesPChunk.pop();

         attribute.parse(mockSource, undefined, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

      it('accepts options with no terminators', () => {
         mockSource = new MockSTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);
         attributesPChunk.pop();

         attribute.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

      it('stops at the specified name terminator', () => {
         litParse.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         mockSource = new MockSTokenSource([
            [ 'versi', 'word', [ '=', 'x' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', 'x' ] ],
         ]);
         attributesPChunk.pop();
         const expectedSToken = makeSTokenMaker();
         attributesPChunk[0].name = expectedSToken('versi');
         attributesPChunk[0].postNameSpace = undefined;
         attributesPChunk[0].equal = undefined;
         attributesPChunk[0].postEqualSpace = undefined;
         delete attributesPChunk[0].trailingSpace;

         attribute.parse(mockSource, { terminators: [ 'x' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

      it('deals with EOF where the attribute name should be', () => {
         litParse.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         mockSource = new MockSTokenSource([
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([]);
      });

      it('deals with EOF after the name', () => {
         litParse.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         mockSource = new MockSTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);
         attributesPChunk.pop();
         attributesPChunk[0].postNameSpace = undefined;
         attributesPChunk[0].equal = undefined;
         attributesPChunk[0].postEqualSpace = undefined;
         delete attributesPChunk[0].trailingSpace;

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(attributesPChunk);
      });

   });

});
