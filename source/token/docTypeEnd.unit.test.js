/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as docTypeEnd from './docTypeEnd.js';

describe('docTypeEnd', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let sourceLToken;
      let expectedLToken;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         sourceLToken = makeLTokenMaker();
         expectedLToken = makeLTokenMaker();
      });

      it('returns after parsing a mundane "]>"', () => {
         mockSource = new MockLTokenSource([
            sourceLToken(']'),
            undefined,
            sourceLToken('>'),
         ]);

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubset: expectedLToken(']'),
            postCloseInternalSubsetSpace: undefined,
            close: expectedLToken('>'),
         });
      });

      it('returns after parsing a "]\\t>"', () => {
         mockSource = new MockLTokenSource([
            sourceLToken(']'),
            sourceLToken('\t'),
            sourceLToken('>'),
         ]);

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubset: expectedLToken(']'),
            postCloseInternalSubsetSpace: expectedLToken('\t'),
            close: expectedLToken('>'),
         });
      });

      it('returns after parsing an incomplete input', () => {
         mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
         ]);

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubset: undefined,
            postCloseInternalSubsetSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;
      let startParsed;

      beforeEach(() => {
         const sourceLToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         startParsed = {
            startInternalSubset: sourceLToken('['),
         };
         parsed = {
            closeInternalSubset: sourceLToken(']'),
            postCloseInternalSubsetSpace: sourceLToken(' '),
            close: sourceLToken('>'),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('returns no errors if no problems ', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         parsed.closeLToken = undefined;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
            params: undefined,
            position: parsed.postCloseInternalSubsetSpaceLToken,
         });
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete startParsed.startInternalSubsetLToken;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: parsed.postCloseInternalSubsetSpaceLToken,
         });
      });

   });

   describe('makeToken()', () => {
      let sourceLToken;

      beforeEach(() => {
         sourceLToken = makeLTokenMaker();
      });

      it('returns a token given a good parsing', () => {
         const parsed = {
            closeInternalSubset: sourceLToken(']'),
            postCloseInternalSubsetSpace: sourceLToken(' '),
            close: sourceLToken('>'),
         };

         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

      it('returns a token given an empty parsing', () => {
         const parsed = {
         };
         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

   });

});
