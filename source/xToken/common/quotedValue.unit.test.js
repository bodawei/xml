/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../../lToken/test';

import * as entityReference from '../entityReference.js';
import * as misc from './misc.js';
import * as quotedValue from './quotedValue.js';
import * as text from '../text.js';

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
            MockLTokenSource.PEEK('"'),
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
            MockLTokenSource.PEEK('\''),
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
            MockLTokenSource.PEEK('"'),
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

      describe('entity references', () => {

         beforeEach(() => {
            spyOn(entityReference, 'parse');
            spyOn(entityReference, 'paramParse');
         });

         it('calls out to entityReference.parse when encountering a % and asked to parse peRefs', () => {
            mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('"'),
               '"',
               undefined,
               MockLTokenSource.PEEK('%'),
               '"',
            ]);

            quotedValue.parse(mockSource, {
               prefix: 'foo',
               parsed: {},
               peRef: true,
            }, callback);
            mockSource.respondInAsyncTime();

            expect(entityReference.paramParse.calls.argsFor(0)[0]).toEqual(mockSource);
         });

         it('calls out to entityReference.parse when encountering a & and asked to parse geRefs', () => {
            mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('"'),
               '"',
               undefined,
               MockLTokenSource.PEEK('&'),
               '"',
            ]);

            quotedValue.parse(mockSource, {
               prefix: 'foo',
               parsed: {},
               geRef: true,
            }, callback);
            mockSource.respondInAsyncTime();

            expect(entityReference.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         });

         it('will handle a combination of text, pe and ge refs', () => {
            entityReference.parse.and.callFake((_1, callback) => {
               callback({});
            });
            entityReference.paramParse.and.callFake((_1, callback) => {
               callback({});
            });
            const pToken = {};
            mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('"'),
               '"',
               'one',
               MockLTokenSource.PEEK('&'),
               'two',
               MockLTokenSource.PEEK('%'),
               'three',
               MockLTokenSource.PEEK('%'),
               'four',
               MockLTokenSource.PEEK('"'),
               '"',
            ]);

            quotedValue.parse(mockSource, {
               prefix: 'foo',
               parsed: pToken,
               peRef: true,
               geRef: true,
            }, callback);
            mockSource.respondInAsyncTime();

            const makeLToken = makeLTokenMaker();
            expect(pToken).toEqual({
               fooOpenQuote: makeLToken('"'),
               fooValue: [
                  makeLToken('one'),
                  {},
                  makeLToken('two'),
                  {},
                  makeLToken('three'),
                  {},
                  makeLToken('four'),
               ],
               fooCloseQuote: makeLToken('"'),
            });
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;
      let parsedQuotedValue;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         const expectedLToken = makeLTokenMaker();
         parsedQuotedValue = {
            parsedOpenQuote: expectedLToken('"'),
            parsedValue: [ expectedLToken('xxx') ],
            parsedCloseQuote: expectedLToken('"'),
         };

         spyOn(misc, 'checkWellFormedText');
         spyOn(entityReference, 'checkWellFormed');
      });

      it('calls misc.checkWellFormedText() to check the value', () => {
         quotedValue.checkWellFormed('parsed', parsedQuotedValue, mockErrorCollector, emd);

         expect(misc.checkWellFormedText.calls.argsFor(0)[0]).toEqual(parsedQuotedValue.parsedValue[0]);
         expect(misc.checkWellFormedText.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(misc.checkWellFormedText.calls.argsFor(0)[2]).toEqual(emd);
      });

      it('reports an error if there is no opening quote', () => {
         delete parsedQuotedValue.parsedOpenQuote;

         quotedValue.checkWellFormed('parsed', parsedQuotedValue, mockErrorCollector, emd, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.QUOTEDVALUE_NO_OPEN_QUOTE,
            params: [ 'aType' ],
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no close quote', () => {
         delete parsedQuotedValue.parsedCloseQuote;

         quotedValue.checkWellFormed('parsed', parsedQuotedValue, mockErrorCollector, emd, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.QUOTEDVALUE_NO_CLOSE_QUOTE,
            params: [ 'aType' ],
            lastPosition: parsedQuotedValue.parsedValue[0],
         });
      });

      it('calls entityReference.checkWellFormed if an entity reference PToken is found', () => {
         parsedQuotedValue.parsedValue.push({
            type: entityReference.TYPE,
         });

         quotedValue.checkWellFormed('parsed', parsedQuotedValue, mockErrorCollector, emd, 'aType');

         expect(entityReference.checkWellFormed.calls.argsFor(0)[0]).toEqual(parsedQuotedValue.parsedValue[1]);
         expect(entityReference.checkWellFormed.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(entityReference.checkWellFormed.calls.argsFor(0)[2]).toEqual(emd);
      });

   });

   describe('makeTokenCompatible()', () => {

      it('returns a Text token from the parsed result', () => {
         const expectedLToken = makeLTokenMaker();
         const pToken = {
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('blah') ],
            fooCloseQuote: expectedLToken('"'),
         };
         const result = quotedValue.makeTokenCompatible('foo', pToken);

         expect(result).toEqual([ new text.Token('blah', pToken.fooValue) ]);
      });

      it('calls entityReference.makeToken for each reference in the pToken value', () => {
         spyOn(entityReference, 'makeToken');
         const expectedLToken = makeLTokenMaker();
         const pToken = {
            fooOpenQuote: expectedLToken('"'),
            fooValue: [ expectedLToken('blah'), {
               type: entityReference.TYPE,
            }, {
               type: entityReference.PARAM_TYPE,
            } ],
            fooCloseQuote: expectedLToken('"'),
         };
         quotedValue.makeTokenCompatible('foo', pToken);

         expect(entityReference.makeToken.calls.count()).toEqual(2);
         expect(entityReference.makeToken.calls.argsFor(0)[0]).toEqual(pToken.fooValue[1]);
         expect(entityReference.makeToken.calls.argsFor(1)[0]).toEqual(pToken.fooValue[2]);
      });

      it('copes with no quoted value at all', () => {
         const result = quotedValue.makeTokenCompatible('foo', {});

         expect(result).toEqual(undefined);
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

      it('adds LTokens from any entity references', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            fooOpenQuote: expectedLToken('"'),
            fooValue: [
               expectedLToken('blah'),
               new entityReference.Token('foo', [ { ltoken: true } ]),
            ],
            fooCloseQuote: expectedLToken('"'),
         };
         const results = [];

         quotedValue.appendLTokens('foo', results, parsed);

         expect(results).toEqual([
            parsed.fooOpenQuote,
            parsed.fooValue[0],
            { ltoken: true },
            parsed.fooCloseQuote,
         ]);
      });

   });
});
