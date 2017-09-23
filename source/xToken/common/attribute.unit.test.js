/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../../lToken/test';

import * as attribute from './attribute.js';
import * as quotedValue from './quotedValue.js';

describe('attribute (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let parsed;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         const expectedLToken = makeLTokenMaker();
         parsed = {
            name: expectedLToken('version'),
            postNameSpace: expectedLToken(' '),
            equal: expectedLToken('='),
            postEqualSpace: expectedLToken(' '),
            trailingSpace: expectedLToken(' '),
         };
         spyOn(quotedValue, 'parse');
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
      });

      it('parses an attribute', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
         mockSource = new MockLTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([ parsed ]);
      });

      it('accepts no options', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);

         attribute.parse(mockSource, undefined, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([ parsed ]);
      });

      it('accepts options with no terminators', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);

         attribute.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([ parsed ]);
      });

      it('stops at the specified name terminator', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ 'versi', 'word', [ '=', 'x' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', 'x' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ 'x' ] }, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         parsed.name = expectedLToken('versi');
         parsed.postNameSpace = undefined;
         parsed.equal = undefined;
         parsed.postEqualSpace = undefined;
         delete parsed.trailingSpace;
         expect(callback.calls.argsFor(0)[0]).toEqual([ parsed ]);
      });

      it('deals with EOF where the attribute name should be', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([]);
      });

      it('deals with EOF after the name', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         parsed.postNameSpace = undefined;
         parsed.equal = undefined;
         parsed.postEqualSpace = undefined;
         delete parsed.trailingSpace;
         expect(callback.calls.argsFor(0)[0]).toEqual([ parsed ]);
      });

   });

});
