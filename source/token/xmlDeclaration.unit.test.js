/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from '../error';

import util from '../chunk/index.test.js';

import xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('version'),
            util.makeChunk(' '),
            util.makeChunk('='),
            util.makeChunk(' '),
            undefined,
            undefined,
            util.makeChunk('?>'),
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
               nameChunk: util.makeChunk('version'),
               postNameSpaceChunk: util.makeChunk(' '),
               equalChunk: util.makeChunk('='),
               postEqualSpaceChunk: util.makeChunk(' '),
            } ],
            closeChunk: util.makeChunk('?>'),
         });
      });

      it('gathers a value if the value is in single quotes', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('version'),
            util.makeChunk(' '),
            util.makeChunk('='),
            undefined,
            util.makeChunk('\''),
            util.makeChunk('\''),
            util.makeChunk('1.3'),
            util.makeChunk('\''),
            undefined,
            undefined,
            util.makeChunk('?>'),
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            params: [ {
               nameChunk: util.makeChunk('version'),
               postNameSpaceChunk: util.makeChunk(' '),
               equalChunk: util.makeChunk('='),
               postEqualSpaceChunk: undefined,
               openQuoteChunk: util.makeChunk('\''),
               valueChunk: util.makeChunk('1.3'),
               closeQuoteChunk: util.makeChunk('\''),
               trailingSpaceChunk: undefined,
            } ],
            closeChunk: util.makeChunk('?>'),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = {
            setPos: jasmine.createSpy('setPosSpy'),
            getErrors: jasmine.createSpy('getErrorsSpy'),
            check: function mockCheck(condition, id, params) {
               if (condition) {
                  if (params) {
                     this.report(id, params);
                  } else {
                     this.report(id);
                  }
               }
            },
            checkName: jasmine.createSpy('checkNameSpy'),
            report: jasmine.createSpy('reportSpy'),
         };

         parsed = {
            openChunk: util.makeChunk('<?'),
            postOpenSpaceChunk: undefined,
            targetChunk: util.makeChunk('xml'),
            postTargetSpaceChunk: util.makeChunk(' '),
            params: [ {
               nameChunk: util.makeChunk('version'),
               equalChunk: util.makeChunk('='),
               openQuoteChunk: util.makeChunk('"'),
               valueChunk: util.makeChunk('1.1'),
               closeQuoteChunk: util.makeChunk('"'),
               trailingSpaceChunk: util.makeChunk(' '),
            }, {
               nameChunk: util.makeChunk('encoding'),
               equalChunk: util.makeChunk('='),
               openQuoteChunk: util.makeChunk('"'),
               valueChunk: util.makeChunk('ascii'),
               closeQuoteChunk: util.makeChunk('"'),
               trailingSpaceChunk: util.makeChunk(' '),
            }, {
               nameChunk: util.makeChunk('standalone'),
               equalChunk: util.makeChunk('='),
               openQuoteChunk: util.makeChunk('"'),
               valueChunk: util.makeChunk('yes'),
               closeQuoteChunk: util.makeChunk('"'),
               trailingSpaceChunk: util.makeChunk(' '),
            } ],
            closeChunk: util.makeChunk('?>'),
         };
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, true);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if a param is the wrong case', () => {
         parsed.params[0].nameChunk = util.makeChunk('VERSION');

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
         parsed.params[2].nameChunk = util.makeChunk('bogus');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, false);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.XMLDECL_ATTR_UNKNOWN, [ 'bogus' ]);
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const parsed = {
            params: [ {
               nameChunk: util.makeChunk('version'),
               postNameSpaceChunk: util.makeChunk(' '),
               equalChunk: util.makeChunk('='),
               postEqualSpaceChunk: util.makeChunk(' '),
               valueChunk: util.makeChunk('1.1'),
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
