/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as docTypeEnd from './docTypeEnd.js';

describe('docTypeEnd', () => {
   let parsedDocTypeEnd;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedDocTypeEnd = {
         type: 'DOCTYPE_END',
         closeInternalSubset: expectedLToken(']'),
         postCloseInternalSubsetSpace: undefined,
         close: expectedLToken('>'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns after parsing a mundane "]>"', () => {
         const mockSource = new MockLTokenSource([
            [ ']', 'match', ']' ],
            [ undefined, 'space' ],
            [ '>', 'match', '>' ],
         ]);

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedDocTypeEnd);
      });

      it('returns after parsing a "]\\t>"', () => {
         const mockSource = new MockLTokenSource([
            ']',
            '\t',
            '>',
         ]);
         const expectedLToken = makeLTokenMaker(undefined, 1, 0, 1);
         parsedDocTypeEnd.postCloseInternalSubsetSpace = expectedLToken('\t');
         parsedDocTypeEnd.close = expectedLToken('>');

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedDocTypeEnd);
      });

      it('copes with EOF', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
         ]);
         parsedDocTypeEnd.closeInternalSubset = undefined;
         parsedDocTypeEnd.postCloseInternalSubsetSpace = undefined;
         parsedDocTypeEnd.close = undefined;

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedDocTypeEnd);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let startParsed;

      beforeEach(() => {
         const expectedLToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         startParsed = {
            startInternalSubset: expectedLToken('['),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeEnd.checkWellFormed(parsedDocTypeEnd, startParsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('returns no errors if no problems ', () => {
         const errors = docTypeEnd.checkWellFormed(parsedDocTypeEnd, startParsed, mockErrorCollector);

         expect(errors.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         parsedDocTypeEnd.closeLToken = undefined;

         docTypeEnd.checkWellFormed(parsedDocTypeEnd, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
            params: undefined,
            position: parsedDocTypeEnd.postCloseInternalSubsetSpaceLToken,
         });
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete startParsed.startInternalSubsetLToken;

         docTypeEnd.checkWellFormed(parsedDocTypeEnd, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: parsedDocTypeEnd.postCloseInternalSubsetSpaceLToken,
         });
      });

      it('reports an error if there is a "]", but there was no start token', () => {
         docTypeEnd.checkWellFormed(parsedDocTypeEnd, undefined, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: parsedDocTypeEnd.postCloseInternalSubsetSpaceLToken,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token given a good parsing', () => {
         const expectedLToken = makeLTokenMaker(undefined, 1, 0, 1);
         parsedDocTypeEnd.postCloseInternalSubsetSpace = expectedLToken('\t');

         const token = docTypeEnd.makeToken(parsedDocTypeEnd);

         expect(token).toEqual(new docTypeEnd.Token([
            parsedDocTypeEnd.closeInternalSubset,
            parsedDocTypeEnd.postCloseInternalSubsetSpace,
            parsedDocTypeEnd.close,
         ]));
      });

      it('returns a token given an empty parsing', () => {
         parsedDocTypeEnd.closeInternalSubset = undefined;
         parsedDocTypeEnd.postCloseInternalSubsetSpace = undefined;
         parsedDocTypeEnd.close = undefined;

         const token = docTypeEnd.makeToken(parsedDocTypeEnd);

         expect(token).toEqual(new docTypeEnd.Token([]));
      });

   });

});
