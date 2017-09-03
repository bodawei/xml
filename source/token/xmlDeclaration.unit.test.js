/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';

import * as chunkUtil from '../chunk/test';

import xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('version'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('='),
            chunkUtil.makeChunk(' '),
            undefined,
            undefined,
            chunkUtil.makeChunk('?>'),
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'xmldecl',
            openChunk: undefined,
            postOpenSpaceChunk: undefined,
            targetChunk: undefined,
            postTargetSpaceChunk: undefined,
            params: [ {
               nameChunk: chunkUtil.makeChunk('version'),
               postNameSpaceChunk: chunkUtil.makeChunk(' '),
               equalChunk: chunkUtil.makeChunk('='),
               postEqualSpaceChunk: chunkUtil.makeChunk(' '),
            } ],
            closeChunk: chunkUtil.makeChunk('?>'),
         });
      });

      it('gathers a value if the value is in single quotes', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('version'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('='),
            undefined,
            chunkUtil.makeChunk('\''),
            chunkUtil.makeChunk('\''),
            chunkUtil.makeChunk('1.3'),
            chunkUtil.makeChunk('\''),
            undefined,
            undefined,
            chunkUtil.makeChunk('?>'),
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            params: [ {
               nameChunk: chunkUtil.makeChunk('version'),
               postNameSpaceChunk: chunkUtil.makeChunk(' '),
               equalChunk: chunkUtil.makeChunk('='),
               postEqualSpaceChunk: undefined,
               openQuoteChunk: chunkUtil.makeChunk('\''),
               valueChunk: chunkUtil.makeChunk('1.3'),
               closeQuoteChunk: chunkUtil.makeChunk('\''),
               trailingSpaceChunk: undefined,
            } ],
            closeChunk: chunkUtil.makeChunk('?>'),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            openChunk: chunkUtil.makeChunk('<?'),
            postOpenSpaceChunk: undefined,
            targetChunk: chunkUtil.makeChunk('xml'),
            postTargetSpaceChunk: chunkUtil.makeChunk(' '),
            params: [ {
               nameChunk: chunkUtil.makeChunk('version'),
               equalChunk: chunkUtil.makeChunk('='),
               openQuoteChunk: chunkUtil.makeChunk('"'),
               valueChunk: chunkUtil.makeChunk('1.1'),
               closeQuoteChunk: chunkUtil.makeChunk('"'),
               trailingSpaceChunk: chunkUtil.makeChunk(' '),
            }, {
               nameChunk: chunkUtil.makeChunk('encoding'),
               equalChunk: chunkUtil.makeChunk('='),
               openQuoteChunk: chunkUtil.makeChunk('"'),
               valueChunk: chunkUtil.makeChunk('ascii'),
               closeQuoteChunk: chunkUtil.makeChunk('"'),
               trailingSpaceChunk: chunkUtil.makeChunk(' '),
            }, {
               nameChunk: chunkUtil.makeChunk('standalone'),
               equalChunk: chunkUtil.makeChunk('='),
               openQuoteChunk: chunkUtil.makeChunk('"'),
               valueChunk: chunkUtil.makeChunk('yes'),
               closeQuoteChunk: chunkUtil.makeChunk('"'),
               trailingSpaceChunk: chunkUtil.makeChunk(' '),
            } ],
            closeChunk: chunkUtil.makeChunk('?>'),
         };
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if a param is the wrong case', () => {
         parsed.params[0].nameChunk = chunkUtil.makeChunk('VERSION');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.XMLDECL_ATTR_INVALID_CASE, [ 'version', 'VERSION' ]);
      });

      it('reports an error if a encoding is in the wrong order', () => {
         const temp = parsed.params[1];
         parsed.params.splice(1, 1);
         parsed.params.push(temp); // put encoding at the end.

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER);
      });

      it('reports no error if encoding has no value', () => {
         parsed.params[1].valueChunk = undefined;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report.calls.allArgs())
            .toEqual([
               [ WellFormedError.ID.ATTRIBUTE_NO_VALUE, [ 'encoding' ] ],
            ]);
      });

      it('reports an error if standalone specified on a non-doc entity', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.TEXTDECL_XTRA_STANDALONE);
      });

      it('reports an error if an unknown parameter is provided', () => {
         parsed.params[2].nameChunk = chunkUtil.makeChunk('bogus');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.XMLDECL_ATTR_UNKNOWN, [ 'bogus' ]);
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const parsed = {
            params: [ {
               nameChunk: chunkUtil.makeChunk('version'),
               postNameSpaceChunk: chunkUtil.makeChunk(' '),
               equalChunk: chunkUtil.makeChunk('='),
               postEqualSpaceChunk: chunkUtil.makeChunk(' '),
               valueChunk: chunkUtil.makeChunk('1.1'),
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(token).toEqual(new xmlDeclaration.Token([ {
            name: 'version',
            value: '1.1',
         } ], []));
      });

   });

});
