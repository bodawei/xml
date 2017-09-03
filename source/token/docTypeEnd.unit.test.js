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
      let expectedLToken;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         expectedLToken = makeLTokenMaker();
      });

      it('returns after parsing a mundane "]>"', () => {
         mockSource = new MockLTokenSource([
            ']',
            undefined,
            '>',
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
            ']',
            '\t',
            '>',
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
         const expectedLToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         startParsed = {
            startInternalSubset: expectedLToken('['),
         };
         parsed = {
            closeInternalSubset: expectedLToken(']'),
            postCloseInternalSubsetSpace: expectedLToken(' '),
            close: expectedLToken('>'),
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

      it('returns a token given a good parsing', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            closeInternalSubset: expectedLToken(']'),
            postCloseInternalSubsetSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         };

         const token = docTypeEnd.makeToken(parsed);

         expect(token).toEqual(new docTypeEnd.Token([
            parsed.closeInternalSubset,
            parsed.postCloseInternalSubsetSpace,
            parsed.close,
         ]));
      });

      it('returns a token given an empty parsing', () => {
         const parsed = {
         };
         const token = docTypeEnd.makeToken(parsed);

         expect(token).toEqual(new docTypeEnd.Token([]));
      });

   });

});
