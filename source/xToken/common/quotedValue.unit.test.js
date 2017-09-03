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
            MockLTokenSource.PEEK,
            '"',
            'blah',
            '"',
         ]);

         quotedValue.parse('foo', mockSource, container, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('"'),
            fooValue: expectedLToken('blah'),
            fooCloseQuote: expectedLToken('"'),
         });
      });

      it('acepts single quotes', () => {
         const container = {};
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            '\'',
            'blah',
            '\'',
         ]);

         quotedValue.parse('foo', mockSource, container, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('\''),
            fooValue: expectedLToken('blah'),
            fooCloseQuote: expectedLToken('\''),
         });
      });

      it('fills in a blank string if there is nothing between the quotes', () => {
         const container = {};
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            '"',
            undefined,
            '"',
         ]);

         quotedValue.parse('foo', mockSource, container, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(container).toEqual({
            fooOpenQuote: expectedLToken('"'),
            fooValue: expectedLToken(''),
            fooCloseQuote: expectedLToken('"'),
         });
      });

   });

   describe('appendLTokens()', () => {

      it('does a basic population', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            fooOpenQuote: expectedLToken('"'),
            fooValue: expectedLToken('blah'),
            fooCloseQuote: expectedLToken('"'),
         };
         const results = [];

         quotedValue.appendLTokens('foo', results, parsed);

         expect(results).toEqual([
            parsed.fooOpenQuote,
            parsed.fooValue,
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
