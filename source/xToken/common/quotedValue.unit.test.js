/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../../lToken/test';

import * as quotedValue from './quotedValue.js';

describe('quotedValue', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         const container = {};
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('"'),
            '"',
            'blah',
            '"',
         ]);

         quotedValue.parse(mockSource, {
            prefix: 'foo',
            parsed: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('blah') ],
            fooCloseQuote: expectedLToken('"'),
         });
      });

      it('acepts single quotes', () => {
         const container = {};
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('"'),
            '\'',
            'blah',
            '\'',
         ]);

         quotedValue.parse(mockSource, {
            prefix: 'foo',
            parsed: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('\''),
            fooValue: [ expectedLToken('blah') ],
            fooCloseQuote: expectedLToken('\''),
         });
      });

      it('fills in a blank string if there is nothing between the quotes', () => {
         const container = {};
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('"'),
            '"',
            undefined,
            '"',
         ]);

         quotedValue.parse(mockSource, {
            prefix: 'foo',
            parsed: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('') ],
            fooCloseQuote: expectedLToken('"'),
         });
      });

   });

   describe('makeOneTokenCompatible()', () => {

      it('returns the string from the parsed result', () => {
         const expectedLToken = makeLTokenMaker();
         const result = quotedValue.makeOneTokenCompatible('foo', {
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('blah') ],
            fooCloseQuote: expectedLToken('"'),
         });

         expect(result).toEqual('blah');
      });

      it('copes with no quoted value at all', () => {
         const result = quotedValue.makeOneTokenCompatible('foo', {});

         expect(result).toEqual(undefined);
      });

   });

   describe('appendLTokens()', () => {

      it('does a basic population', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('blah') ],
            fooCloseQuote: expectedLToken('"'),
         };
         const results = [];

         quotedValue.appendLTokens('foo', results, parsed);

         expect(results).toEqual([
            parsed.fooOpenQuote,
            parsed.fooValue[0],
            parsed.fooCloseQuote,
         ]);
      });

      it('adds nothing if the parsed value is undefined', () => {
         const results = [];

         quotedValue.appendLTokens('foo', results, undefined);

         expect(results).toEqual([
         ]);
      });

   });
});
