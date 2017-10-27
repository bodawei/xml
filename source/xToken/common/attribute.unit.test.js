/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { MockErrorCollector } from '../../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../../lToken/test';
import { WellFormedError } from '../../error';

import * as attribute from './attribute.js';
import * as misc from './misc.js';
import * as literal from './literal.js';

describe('attribute (unit)', () => {
   let parsedAttributes;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedAttributes = [ {
         name: expectedLToken('version'),
         postNameSpace: expectedLToken(' '),
         equal: expectedLToken('='),
         postEqualSpace: expectedLToken(' '),
         trailingSpace: expectedLToken(' '),
      }, {
         name: expectedLToken('another'),
         postNameSpace: undefined,
         equal: expectedLToken('='),
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
         mockSource = new MockLTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);
         parsedAttributes.pop();

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

      it('parses multiple attributes', () => {
         mockSource = new MockLTokenSource([
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

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

      it('accepts no options', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);
         parsedAttributes.pop();

         attribute.parse(mockSource, undefined, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

      it('accepts options with no terminators', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            ' ',
            undefined,
         ]);
         parsedAttributes.pop();

         attribute.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

      it('stops at the specified name terminator', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ 'versi', 'word', [ '=', 'x' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', 'x' ] ],
         ]);
         parsedAttributes.pop();
         const expectedLToken = makeLTokenMaker();
         parsedAttributes[0].name = expectedLToken('versi');
         parsedAttributes[0].postNameSpace = undefined;
         parsedAttributes[0].equal = undefined;
         parsedAttributes[0].postEqualSpace = undefined;
         delete parsedAttributes[0].trailingSpace;

         attribute.parse(mockSource, { terminators: [ 'x' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

      it('deals with EOF where the attribute name should be', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ undefined, 'word', [ '=', '>' ] ],
         ]);

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual([]);
      });

      it('deals with EOF after the name', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            [ 'version', 'word', [ '=', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'word', [ '=', '>' ] ],
         ]);
         parsedAttributes.pop();
         parsedAttributes[0].postNameSpace = undefined;
         parsedAttributes[0].equal = undefined;
         parsedAttributes[0].postEqualSpace = undefined;
         delete parsedAttributes[0].trailingSpace;

         attribute.parse(mockSource, { terminators: [ '>' ] }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqual(parsedAttributes);
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let mockErrorCollector;
      let previousSpace;

      beforeEach(() => {
         emd = new EntityMetaData();
         const makeToken = makeLTokenMaker();
         previousSpace = makeToken(' ');
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedText');
         spyOn(literal, 'checkWellFormed');
      });

      it('calls the misc.checkName() routine', () => {
         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd, previousSpace, '');

         expect(misc.checkName).toHaveBeenCalledWith(parsedAttributes[0].name, mockErrorCollector, emd,
            WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
      });

      it('asks the literal module to look for problems in the declaration part', () => {
         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         const params = literal.checkWellFormed.calls.argsFor(0);
         expect(params[0]).toEqual('attr');
         expect(params[1]).toEqual(parsedAttributes[0]);
         expect(params[2]).toEqual(mockErrorCollector);
         expect(params[3]).toEqual(emd);
         expect(params[4]).toEqual(WellFormedError.ID.NOUN_ATTRIBUTE);
         expect(params[5] instanceof Function).toEqual(true);
      });

      it('reports an error if there is no space before the first attribute name', () => {
         previousSpace = undefined;

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'version' ],
            position: undefined,
         });
      });

      it('reports an error if there is no space between the first and second attrs', () => {
         delete parsedAttributes[0].trailingSpace;

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'another' ],
            lastPosition: parsedAttributes[0].postEqualSpace,
         });
      });

      it('calls the checkName function, if provided', () => {
         const checkName = jasmine.createSpy('checkName spy');

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, checkName);

         expect(checkName).toHaveBeenCalledWith(parsedAttributes[0].name, 0, mockErrorCollector, emd);
      });

      it('calls the checkValue function, if provided', () => {
         const checkValue = jasmine.createSpy('checkValue spy');
         literal.checkWellFormed.and.callFake((_1, _2, _3, _4, _5, callback) => {
            callback();
         });

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, undefined, checkValue);

         expect(checkValue).toHaveBeenCalledWith(parsedAttributes[0].name,
            parsedAttributes[0].attrValue, mockErrorCollector, emd);
      });

      it('reports an error if there is no "=" found', () => {
         delete parsedAttributes[0].equal;

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_EQUAL,
            params: [ 'version' ],
            lastPosition: parsedAttributes[0].postNameSpace,
         });
      });

      it('reports an error if attributes have duplicate names', () => {
         parsedAttributes[1].name.text = parsedAttributes[0].name.text;

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_DUPLICATE_NAME,
            params: [ 'version' ],
            position: parsedAttributes[1].name,
         });
      });

      it('reports no error if there is a duplicate name but it is not an attribute', () => {
         parsedAttributes[1].name.text = parsedAttributes[0].name.text;

         attribute.checkWellFormed(parsedAttributes, mockErrorCollector, emd,
            previousSpace, 'other');

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

   });

   describe('makeTokenCompatible()', () => {

      beforeEach(() => {
         spyOn(literal, 'makeTokenCompatible');
      });

      it('calls literal.appendLTokens()', () => {
         parsedAttributes.pop();

         attribute.makeTokenCompatible(parsedAttributes);

         expect(literal.makeTokenCompatible).toHaveBeenCalledWith('attr', parsedAttributes[0]);
      });

      it('returns name value pairs from the parsing', () => {
         const attrs = attribute.makeTokenCompatible(parsedAttributes);

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
         parsedAttributes.pop();

         attribute.makeOneTokenCompatible(parsedAttributes);

         expect(literal.makeOneTokenCompatible).toHaveBeenCalledWith('attr', parsedAttributes[0]);
      });

      it('returns name value pairs', () => {
         const attrs = attribute.makeOneTokenCompatible(parsedAttributes);

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

   describe('appendLTokens', () => {

      beforeEach(() => {
         spyOn(literal, 'appendLTokens');
      });

      it('calls literal.appendLTokens()', () => {
         const results = [];
         parsedAttributes.pop();

         attribute.appendLTokens(results, parsedAttributes);

         expect(literal.appendLTokens).toHaveBeenCalledWith('attr', results, parsedAttributes[0]);
      });

      it('returns the LTokens that made up the attribute', () => {
         const results = [];

         attribute.appendLTokens(results, parsedAttributes);

         expect(results).toEqual([
            parsedAttributes[0].name,
            parsedAttributes[0].postNameSpace,
            parsedAttributes[0].equal,
            parsedAttributes[0].postEqualSpace,
            parsedAttributes[0].trailingSpace,
            parsedAttributes[1].name,
            parsedAttributes[1].equal,
         ]);
      });

      it('returns an empty array if no attributes are passed', () => {
         const results = [];

         attribute.appendLTokens(results, undefined);

         expect(results).toEqual([]);
      });

   });

});
