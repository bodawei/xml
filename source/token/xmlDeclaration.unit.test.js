/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            undefined,
            undefined,
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            type: 'XMLDECL',
            open: undefined,
            postOpenSpace: undefined,
            target: undefined,
            postTargetSpace: undefined,
            params: [ {
               name: expectedLToken('version'),
               postNameSpace: expectedLToken(' '),
               equal: expectedLToken('='),
               postEqualSpace: expectedLToken(' '),
            } ],
            close: expectedLToken('?>'),
         });
      });

      it('gathers a value if the value is in single quotes', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            undefined,
            MockLTokenSource.PEEK('\''),
            '\'',
            '1.3',
            '\'',
            undefined,
            undefined,
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            params: [ {
               name: expectedLToken('version'),
               postNameSpace: expectedLToken(' '),
               equal: expectedLToken('='),
               postEqualSpace: undefined,
               openQuote: expectedLToken('\''),
               value: expectedLToken('1.3'),
               closeQuote: expectedLToken('\''),
               trailingSpace: undefined,
            } ],
            close: expectedLToken('?>'),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         const makeToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            open: makeToken('<?'),
            postOpenSpace: undefined,
            target: makeToken('xml'),
            postTargetSpace: makeToken(' '),
            params: [ {
               name: makeToken('version'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('1.1'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('encoding'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('ascii'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('standalone'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('yes'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            } ],
            close: makeToken('?>'),
         };
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if a param is the wrong case', () => {
         const makeToken = makeLTokenMaker();
         parsed.params[0].name = makeToken('VERSION');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_INVALID_CASE,
            params: [ 'version', 'VERSION' ],
            position: parsed.params[0].name,
         });
      });

      it('reports an error if a encoding is in the wrong order', () => {
         const temp = parsed.params[1];
         parsed.params.splice(1, 1);
         parsed.params.push(temp); // put encoding at the end.

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
            params: undefined,
            position: parsed.params[2].name,
         });
      });

      it('reports an error if encoding has no value', () => {
         parsed.params[1].value = undefined;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_VALUE,
            params: [ 'encoding' ],
            position: undefined,
            lastPosition: parsed.params[1].openQuote,
         });
      });

      it('reports an error if standalone specified on a non-doc entity', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_XTRA_STANDALONE,
            params: undefined,
            position: parsed.params[2].name,
         });
      });

      it('reports an error if an unknown parameter is provided', () => {
         const makeToken = makeLTokenMaker();
         parsed.params[2].name = makeToken('bogus');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_UNKNOWN,
            params: [ 'bogus' ],
            position: parsed.params[2].name,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const makeToken = makeLTokenMaker();
         const parsed = {
            params: [ {
               name: makeToken('version'),
               postNameSpace: makeToken(' '),
               equal: makeToken('='),
               postEqualSpace: makeToken(' '),
               value: makeToken('1.1'),
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(token).toEqual(new xmlDeclaration.Token([ {
            name: 'version',
            value: '1.1',
         } ], [
            parsed.params[0].name,
            parsed.params[0].postNameSpace,
            parsed.params[0].equal,
            parsed.params[0].postEqualSpace,
            parsed.params[0].value,
         ]));
      });

   });

});
