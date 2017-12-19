/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';

import entityReference from '../entityReference.js';
import * as misc from './misc.js';
import * as literal from './literal.js';
import * as text from '../text.js';

describe('literal (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            'blah',
            MockSTokenSource.PEEK('"'),
            '"',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('blah') ],
            closeQuote: expectedSToken('"'),
         });
      });

      it('acepts single quotes', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '\'',
            'blah',
            MockSTokenSource.PEEK('\''),
            '\'',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ true ] ]);
         expect(container).toEqual({
            openQuote: expectedSToken('\''),
            value: [ expectedSToken('blah') ],
            closeQuote: expectedSToken('\''),
         });
      });

      it('fills in a blank string if there is nothing between the quotes', () => {
         const container = {};
         mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('"'),
            '"',
            undefined,
            MockSTokenSource.PEEK('"'),
            '"',
         ]);

         literal.parse(mockSource, {
            pToken: container,
         }, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker();
         expect(container).toEqual({
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('') ],
            closeQuote: expectedSToken('"'),
         });
      });

      describe('entity references', () => {

         beforeEach(() => {
            spyOn(entityReference, 'parse');
            spyOn(entityReference, 'paramParse');
         });

         it('calls out to entityReference.parse when encountering a % and asked to parse peRefs', () => {
            mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('"'),
               '"',
               undefined,
               MockSTokenSource.PEEK('%'),
            ]);

            literal.parse(mockSource, {
               pToken: {},
               peRef: true,
            }, callback);
            mockSource.respondInAsyncTime();

            expect(entityReference.paramParse.calls.argsFor(0)[0]).toEqual(mockSource);
         });

         it('calls out to entityReference.parse when encountering a & and asked to parse geRefs', () => {
            mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('"'),
               '"',
               undefined,
               MockSTokenSource.PEEK('&'),
            ]);

            literal.parse(mockSource, {
               pToken: {},
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
            mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('"'),
               '"',
               'one',
               MockSTokenSource.PEEK('&'),
               'two',
               MockSTokenSource.PEEK('%'),
               'three',
               MockSTokenSource.PEEK('%'),
               'four',
               MockSTokenSource.PEEK('"'),
               '"',
            ]);

            literal.parse(mockSource, {
               pToken: pToken,
               peRef: true,
               geRef: true,
            }, callback);
            mockSource.respondInAsyncTime();

            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual({
               openQuote: makeSToken('"'),
               value: [
                  makeSToken('one'),
                  {},
                  makeSToken('two'),
                  {},
                  makeSToken('three'),
                  {},
                  makeSToken('four'),
               ],
               closeQuote: makeSToken('"'),
            });
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;
      let literalPToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         const expectedSToken = makeSTokenMaker();
         literalPToken = {
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('xxx') ],
            closeQuote: expectedSToken('"'),
         };

         spyOn(misc, 'checkWellFormedText');
         spyOn(entityReference, 'checkWellFormed');
      });

      it('calls misc.checkWellFormedText() to check the value', () => {
         literal.checkWellFormed(literalPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText.calls.argsFor(0)[0]).toEqual(literalPToken.value[0]);
         expect(misc.checkWellFormedText.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(misc.checkWellFormedText.calls.argsFor(0)[2]).toEqual(emd);
      });

      it('reports an error if there is no opening quote', () => {
         delete literalPToken.openQuote;

         literal.checkWellFormed(literalPToken, mockErrorCollector, emd, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.LITERAL_NO_OPEN_QUOTE,
            params: [ 'aType' ],
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no close quote', () => {
         delete literalPToken.closeQuote;

         literal.checkWellFormed(literalPToken, mockErrorCollector, emd, 'aType');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE,
            params: [ 'aType' ],
            lastPosition: literalPToken.value[0],
         });
      });

      it('calls entityReference.checkWellFormed if an entity reference PToken is found', () => {
         literalPToken.value.push({
            type: entityReference.PTYPE,
         });

         literal.checkWellFormed(literalPToken, mockErrorCollector, emd, 'aType');

         expect(entityReference.checkWellFormed.calls.argsFor(0)[0]).toEqual(literalPToken.value[1]);
         expect(entityReference.checkWellFormed.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(entityReference.checkWellFormed.calls.argsFor(0)[2]).toEqual(emd);
      });

   });

   describe('makeTokenCompatible()', () => {

      it('returns a Text token from the PToken result', () => {
         const expectedSToken = makeSTokenMaker();
         const pToken = {
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('blah') ],
            closeQuote: expectedSToken('"'),
         };
         const result = literal.makeTokenCompatible(pToken);

         expect(result).toEqual([ new text.XToken('blah', { text: pToken.value[0] }) ]);
      });

      it('calls entityReference.makeToken for each reference in the pToken value', () => {
         spyOn(entityReference, 'pTokenToXToken');
         const expectedSToken = makeSTokenMaker();
         const pToken = {
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('blah'), {
               type: entityReference.PTYPE,
            }, {
               type: entityReference.PARAM_PTYPE,
            } ],
            closeQuote: expectedSToken('"'),
         };
         literal.makeTokenCompatible(pToken);

         expect(entityReference.pTokenToXToken.calls.count()).toEqual(2);
         expect(entityReference.pTokenToXToken.calls.argsFor(0)[0]).toEqual(pToken.value[1]);
         expect(entityReference.pTokenToXToken.calls.argsFor(1)[0]).toEqual(pToken.value[2]);
      });

      it('copes with no quoted value at all', () => {
         const result = literal.makeTokenCompatible({});

         expect(result).toEqual(undefined);
      });

   });

   describe('makeOneTokenCompatible()', () => {

      it('returns the string from the PToken result', () => {
         const expectedSToken = makeSTokenMaker();
         const result = literal.makeOneTokenCompatible({
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('blah') ],
            closeQuote: expectedSToken('"'),
         });

         expect(result).toEqual('blah');
      });

      it('copes with no quoted value at all', () => {
         const result = literal.makeOneTokenCompatible({});

         expect(result).toEqual(undefined);
      });

   });

   describe('getSTokens()', () => {

      it('does a basic population', () => {
         const expectedSToken = makeSTokenMaker();
         const pToken = {
            openQuote: expectedSToken('"'),
            value: [ expectedSToken('blah') ],
            closeQuote: expectedSToken('"'),
         };
         const results = literal.getSTokens(pToken);

         expect(results).toEqual([
            pToken.openQuote,
            pToken.value[0],
            pToken.closeQuote,
         ]);
      });

      it('adds nothing if the PToken value is undefined', () => {
         const results = literal.getSTokens(undefined);

         expect(results).toEqual([]);
      });

      it('adds STokens from any entity references', () => {
         const expectedSToken = makeSTokenMaker();
         const pToken = {
            openQuote: expectedSToken('"'),
            value: [
               expectedSToken('blah'),
               new entityReference.XToken('foo', [ { stoken: true } ]),
            ],
            closeQuote: expectedSToken('"'),
         };
         const results = literal.getSTokens(pToken);

         expect(results).toEqual([
            pToken.openQuote,
            pToken.value[0],
            { stoken: true },
            pToken.closeQuote,
         ]);
      });

   });
});
