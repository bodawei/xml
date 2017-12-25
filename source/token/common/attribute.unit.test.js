/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { MockErrorCollector } from '../../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';
import { WellFormedError } from '../../error';

import attribute from './attribute.js';
import misc from './misc.js';
import literal from './literal.js';

describe('attribute (unit)', () => {
   let attributesPChunk;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      attributesPChunk = [ {
         name: expectedSToken('version'),
         postNameSpace: expectedSToken(' '),
         equal: expectedSToken('='),
         postEqualSpace: expectedSToken(' '),
         trailingSpace: expectedSToken(' '),
      }, {
         name: expectedSToken('another'),
         postNameSpace: undefined,
         equal: expectedSToken('='),
         postEqualSpace: undefined,
         trailingSpace: undefined,
      } ];
   });

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse');
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
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
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
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
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         mockSource = new MockSTokenSource([
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([]);
      });

      it('deals with EOF after the name', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
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

   describe('checkWellFormed()', () => {
      let emd;
      let mockErrorCollector;
      let previousSpace;

      beforeEach(() => {
         emd = new EntityMetaData();
         const makeToken = makeSTokenMaker();
         previousSpace = makeToken(' ');
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedText');
         spyOn(literal, 'checkWellFormed');
      });

      it('calls the misc.checkName() routine', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd, previousSpace, '');

         expect(misc.checkName).toHaveBeenCalledWith(attributesPChunk[0].name, mockErrorCollector, emd,
            WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
      });

      it('asks the literal module to look for problems in the declaration part', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         const params = literal.checkWellFormed.calls.argsFor(0);
         expect(params[0]).toEqual(attributesPChunk[0]);
         expect(params[1]).toEqual(mockErrorCollector);
         expect(params[2]).toEqual(emd);
         expect(params[3]).toEqual(WellFormedError.ID.NOUN_ATTRIBUTE);
         expect(params[4] instanceof Function).toEqual(true);
      });

      it('reports an error if there is no space before the first attribute name', () => {
         previousSpace = undefined;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'version' ],
            position: undefined,
         });
      });

      it('reports an error if there is no space between the first and second attrs', () => {
         delete attributesPChunk[0].trailingSpace;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'another' ],
            lastPosition: attributesPChunk[0].postEqualSpace,
         });
      });

      it('calls the checkName function, if provided', () => {
         const checkName = jasmine.createSpy('checkName spy');

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, checkName);

         expect(checkName).toHaveBeenCalledWith(attributesPChunk[0].name, 0, mockErrorCollector, emd);
      });

      it('calls the checkValue function, if provided', () => {
         const checkValue = jasmine.createSpy('checkValue spy');
         literal.checkWellFormed.and.callFake((_2, _3, _4, _5, callback) => {
            callback();
         });

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, undefined, checkValue);

         expect(checkValue).toHaveBeenCalledWith(attributesPChunk[0].name,
            attributesPChunk[0].value, mockErrorCollector, emd);
      });

      it('reports an error if there is no "=" found', () => {
         delete attributesPChunk[0].equal;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_EQUAL,
            params: [ 'version' ],
            lastPosition: attributesPChunk[0].postNameSpace,
         });
      });

      it('reports an error if attributes have duplicate names', () => {
         attributesPChunk[1].name.text = attributesPChunk[0].name.text;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_DUPLICATE_NAME,
            params: [ 'version' ],
            position: attributesPChunk[1].name,
         });
      });

      it('reports no error if there is a duplicate name but it is not an attribute', () => {
         attributesPChunk[1].name.text = attributesPChunk[0].name.text;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, 'other');

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

   });

   describe('makeTokenCompatible()', () => {

      beforeEach(() => {
         spyOn(literal, 'makeTokenCompatible');
      });

      it('calls literal.makeTokenCompatible()', () => {
         attributesPChunk.pop();

         attribute.makeTokenCompatible(attributesPChunk);

         expect(literal.makeTokenCompatible).toHaveBeenCalledWith(attributesPChunk[0]);
      });

      it('returns name value pairs from the parsing', () => {
         const attrs = attribute.makeTokenCompatible(attributesPChunk);

         expect(attrs).toEqual([ {
            name: 'version',
            value: undefined,
         }, {
            name: 'another',
            value: undefined,
         } ]);
      });

      it('copes with no attributes at all', () => {
         const attrs = attribute.makeTokenCompatible([]);

         expect(attrs).toEqual([]);
      });

      it('copes with not even an array as parameters', () => {
         const attrs = attribute.makeTokenCompatible(undefined);

         expect(attrs).toEqual([]);
      });

   });

   describe('makeOneTokenCompatible()', () => {

      beforeEach(() => {
         spyOn(literal, 'makeOneTokenCompatible');
      });

      it('calls literal.makeOneTokenCompatible()', () => {
         attributesPChunk.pop();

         attribute.makeOneTokenCompatible(attributesPChunk);

         expect(literal.makeOneTokenCompatible).toHaveBeenCalledWith(attributesPChunk[0]);
      });

      it('returns name value pairs', () => {
         const attrs = attribute.makeOneTokenCompatible(attributesPChunk);

         expect(attrs).toEqual([ {
            name: 'version',
            value: undefined,
         }, {
            name: 'another',
            value: undefined,
         } ]);
      });

      it('copes with no attributes at all', () => {
         const attrs = attribute.makeOneTokenCompatible([]);

         expect(attrs).toEqual([]);
      });

      it('copes with not even an array as parameters', () => {
         const attrs = attribute.makeOneTokenCompatible(undefined);

         expect(attrs).toEqual([]);
      });

   });

   describe('getSTokens()', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
      });

      it('calls literal.getSTokens()', () => {
         attributesPChunk.pop();

         attribute.getSTokens(attributesPChunk);

         expect(literal.getSTokens).toHaveBeenCalledWith(attributesPChunk[0]);
      });

      it('returns the STokens that made up the attribute', () => {
         const results = attribute.getSTokens(attributesPChunk);

         expect(results).toEqual([
            attributesPChunk[0].name,
            attributesPChunk[0].postNameSpace,
            attributesPChunk[0].equal,
            attributesPChunk[0].postEqualSpace,
            attributesPChunk[0].trailingSpace,
            attributesPChunk[1].name,
            attributesPChunk[1].equal,
         ]);
      });

      it('returns an empty array if no attributes are passed', () => {
         const results = attribute.getSTokens(undefined);

         expect(results).toEqual([]);
      });

   });

});
