/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';

import * as lTokenUtil from '../lToken/test';

import xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('version'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('='),
            lTokenUtil.makeLToken(' '),
            undefined,
            undefined,
            lTokenUtil.makeLToken('?>'),
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'XML_DECLARATION',
            openLToken: undefined,
            postOpenSpaceLToken: undefined,
            targetLToken: undefined,
            postTargetSpaceLToken: undefined,
            params: [ {
               nameLToken: lTokenUtil.makeLToken('version'),
               postNameSpaceLToken: lTokenUtil.makeLToken(' '),
               equalLToken: lTokenUtil.makeLToken('='),
               postEqualSpaceLToken: lTokenUtil.makeLToken(' '),
            } ],
            closeLToken: lTokenUtil.makeLToken('?>'),
         });
      });

      it('gathers a value if the value is in single quotes', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('version'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('='),
            undefined,
            lTokenUtil.makeLToken('\''),
            lTokenUtil.makeLToken('\''),
            lTokenUtil.makeLToken('1.3'),
            lTokenUtil.makeLToken('\''),
            undefined,
            undefined,
            lTokenUtil.makeLToken('?>'),
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            params: [ {
               nameLToken: lTokenUtil.makeLToken('version'),
               postNameSpaceLToken: lTokenUtil.makeLToken(' '),
               equalLToken: lTokenUtil.makeLToken('='),
               postEqualSpaceLToken: undefined,
               openQuoteLToken: lTokenUtil.makeLToken('\''),
               valueLToken: lTokenUtil.makeLToken('1.3'),
               closeQuoteLToken: lTokenUtil.makeLToken('\''),
               trailingSpaceLToken: undefined,
            } ],
            closeLToken: lTokenUtil.makeLToken('?>'),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            openLToken: lTokenUtil.makeLToken('<?'),
            postOpenSpaceLToken: undefined,
            targetLToken: lTokenUtil.makeLToken('xml'),
            postTargetSpaceLToken: lTokenUtil.makeLToken(' '),
            params: [ {
               nameLToken: lTokenUtil.makeLToken('version'),
               equalLToken: lTokenUtil.makeLToken('='),
               openQuoteLToken: lTokenUtil.makeLToken('"'),
               valueLToken: lTokenUtil.makeLToken('1.1'),
               closeQuoteLToken: lTokenUtil.makeLToken('"'),
               trailingSpaceLToken: lTokenUtil.makeLToken(' '),
            }, {
               nameLToken: lTokenUtil.makeLToken('encoding'),
               equalLToken: lTokenUtil.makeLToken('='),
               openQuoteLToken: lTokenUtil.makeLToken('"'),
               valueLToken: lTokenUtil.makeLToken('ascii'),
               closeQuoteLToken: lTokenUtil.makeLToken('"'),
               trailingSpaceLToken: lTokenUtil.makeLToken(' '),
            }, {
               nameLToken: lTokenUtil.makeLToken('standalone'),
               equalLToken: lTokenUtil.makeLToken('='),
               openQuoteLToken: lTokenUtil.makeLToken('"'),
               valueLToken: lTokenUtil.makeLToken('yes'),
               closeQuoteLToken: lTokenUtil.makeLToken('"'),
               trailingSpaceLToken: lTokenUtil.makeLToken(' '),
            } ],
            closeLToken: lTokenUtil.makeLToken('?>'),
         };
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if a param is the wrong case', () => {
         parsed.params[0].nameLToken = lTokenUtil.makeLToken('VERSION');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_INVALID_CASE,
            params: [ 'version', 'VERSION' ],
            position: parsed.params[0].nameLToken,
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
            position: parsed.params[2].nameLToken,
         });
      });

      it('reports an error if encoding has no value', () => {
         parsed.params[1].valueLToken = undefined;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_VALUE,
            params: [ 'encoding' ],
            position: undefined,
            lastPosition: parsed.params[1].openQuoteLToken,
         });
      });

      it('reports an error if standalone specified on a non-doc entity', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_XTRA_STANDALONE,
            params: undefined,
            position: parsed.params[2].nameLToken,
         });
      });

      it('reports an error if an unknown parameter is provided', () => {
         parsed.params[2].nameLToken = lTokenUtil.makeLToken('bogus');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_UNKNOWN,
            params: [ 'bogus' ],
            position: parsed.params[2].nameLToken,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const parsed = {
            params: [ {
               nameLToken: lTokenUtil.makeLToken('version'),
               postNameSpaceLToken: lTokenUtil.makeLToken(' '),
               equalLToken: lTokenUtil.makeLToken('='),
               postEqualSpaceLToken: lTokenUtil.makeLToken(' '),
               valueLToken: lTokenUtil.makeLToken('1.1'),
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(token).toEqual(new xmlDeclaration.Token([ {
            name: 'version',
            value: '1.1',
         } ], [
            parsed.params[0].nameLToken,
            parsed.params[0].postNameSpaceLToken,
            parsed.params[0].equalLToken,
            parsed.params[0].postEqualSpaceLToken,
            parsed.params[0].valueLToken,
         ]));
      });

   });

});
