/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { SToken } from 'sToken';

import * as langAttribute from '../langAttribute';
import attribute from '../attribute';
import misc from '../misc';
import literal from '../literal';
import { GeneralEntityReferencePToken } from 'source/token/generalEntityReference';
import { TextPToken } from 'source/token/text';

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
         expect(litParse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
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

   describe('checkWellFormed()', () => {
      let emd: EntityMetaData;
      let mockErrorCollector: MockErrorCollector;
      let previousSpace: SToken;
      let litCheck: jasmine.Spy;

      beforeEach(() => {
         emd = new EntityMetaData();
         const makeToken = makeSTokenMaker();
         previousSpace = makeToken(' ');
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedText');
         spyOn(misc, 'checkWellFormedNameRecommendation');
         litCheck = spyOn(literal, 'checkWellFormed');
         spyOn(langAttribute, 'checkXmlLangWellFormed');
      });

      it('calls the misc.checkName() routine', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd, previousSpace, '');

         expect(misc.checkName).toHaveBeenCalledWith(attributesPChunk[0].name, mockErrorCollector, emd,
            WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
      });

      it('calls the langAttribute.checkXmlLangWellFormed() routine', () => {
         attributesPChunk[0].name.str = 'xml:lang';
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(langAttribute.checkXmlLangWellFormed)
            .toHaveBeenCalledWith(attributesPChunk[0].value, mockErrorCollector, emd);
      });

      it('asks the literal module to look for problems in the declaration part', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         const params = litCheck.calls.argsFor(0);
         expect(params[0]).toEqual(attributesPChunk[0]);
         expect(params[1]).toEqual(mockErrorCollector);
         expect(params[2]).toEqual(emd);
         expect(params[3]).toEqual(WellFormedError.ID.NOUN_ATTRIBUTE);
         expect(params[4] instanceof Function).toEqual(true);
      });

      it('reports an error if there is no space before the first attribute name', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            undefined as any, WellFormedError.ID.NOUN_ATTRIBUTE);

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

      it('calls the checkWellFormedNameRecommendation() function', () => {
         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, () => {});

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
            attributesPChunk[0].name, mockErrorCollector, emd, 'ATTRIBUTE',
            XmlWarning.ID.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
            XmlWarning.ID.ATTRIBUTE_NAME_XML_RESERVED);
      });

      it('calls the checkName function, if provided', () => {
         const checkName = jasmine.createSpy('checkName spy');

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE, checkName);

         expect(checkName).toHaveBeenCalledWith(attributesPChunk[0].name, 0, mockErrorCollector, emd);
      });

      it('calls the checkValue function, if provided', () => {
         const checkValue = jasmine.createSpy('checkValue spy');
         litCheck.and.callFake((_2: any, _3: any, _4: any, _5: any, callback: Function) => {
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
         attributesPChunk[1].name.str = attributesPChunk[0].name.str;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_DUPLICATE_NAME,
            params: [ 'version' ],
            position: attributesPChunk[1].name,
         });
      });

      it('reports no error if there is a duplicate name but it is not an attribute', () => {
         attributesPChunk[1].name.str = attributesPChunk[0].name.str;

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, 'other');

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if there is a "<" in the attribute value', () => {
         litCheck.and.callFake((_2: any, _3: any, _4: any, _5: any, cb: Function) => {
            cb();
         });

         attributesPChunk[1].value = [
            new TextPToken({ text: SToken.fromString('foo') }),
            new GeneralEntityReferencePToken({ open: SToken.fromString('&') }),
            new TextPToken({ text: SToken.fromString('t<o') }),
         ];

         attribute.checkWellFormed(attributesPChunk, mockErrorCollector, emd,
            previousSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
            params: [ 'another' ],
            lastPosition: attributesPChunk[1].equal
         });
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
            value: [],
         }, {
            name: 'another',
            value: [],
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
            value: [],
         }, {
            name: 'another',
            value: [],
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

      it('handles most attributes being missing', () => {
         const results = attribute.getSTokens([{
            value: []
         }] as any);

         expect(results).toEqual([]);
      });

      it('returns an empty array if no attributes are passed', () => {
         const results = attribute.getSTokens(undefined);

         expect(results).toEqual([]);
      });

   });

});
