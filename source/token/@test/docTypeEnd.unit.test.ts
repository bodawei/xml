/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { MockErrorCollector } from'error-test';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError } from '../../error';

import * as docTypeEnd from '../docTypeEnd';
import { DocTypeStartPToken } from '../docTypeStart';
import { EntityMetaData } from 'basic';

describe('docTypeEnd (unit)', () => {
   let docTypeEndPToken: docTypeEnd.DocTypeEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeEndPToken = {
         type: 'DOCTYPE_END',
         closeInternalSubset: makeSToken(']'),
         postCloseInternalSubsetSpace: undefined,
         close: makeSToken('>'),
      } as any;
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new docTypeEnd.PToken(docTypeEndPToken);

            expect(pToken.getSTokenArray()).toEqual([
               pToken.closeInternalSubset,
               pToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns after parsing a mundane "]>"', () => {
         const mockSource = new MockSTokenSource([
            [ ']', 'match', ']' ],
            [ undefined, 'space' ],
            [ '>', 'match', '>' ],
         ]);

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(docTypeEndPToken);
      });

      it('returns after parsing a "]\\t>"', () => {
         const mockSource = new MockSTokenSource([
            ']',
            '\t',
            '>',
         ]);
         const makeSToken = makeSTokenMaker(undefined, 1, 0, 1);
         docTypeEndPToken.postCloseInternalSubsetSpace = makeSToken('\t');
         docTypeEndPToken.close = makeSToken('>');

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(docTypeEndPToken);
      });

      it('copes with EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ]);
         docTypeEndPToken.closeInternalSubset = undefined;
         docTypeEndPToken.postCloseInternalSubsetSpace = undefined;
         docTypeEndPToken.close = undefined;

         docTypeEnd.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(docTypeEndPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let docTypeStartPToken: DocTypeStartPToken;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         docTypeStartPToken = {
            startInternalSubset: makeSToken('['),
         } as any;
      });

      it('returns an an error collector', () => {
         const errors = docTypeEnd.checkWellFormed(docTypeEndPToken, docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(errors).toEqual(mockErrorCollector);
      });

      it('returns no errors if no problems ', () => {
         const errors = docTypeEnd.checkWellFormed(docTypeEndPToken, docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(errors.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         docTypeEndPToken.close = undefined;

         docTypeEnd.checkWellFormed(docTypeEndPToken, docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
            params: undefined,
            position: docTypeEndPToken.postCloseInternalSubsetSpace,
         });
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete docTypeStartPToken.startInternalSubset;

         docTypeEnd.checkWellFormed(docTypeEndPToken, docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: docTypeEndPToken.postCloseInternalSubsetSpace,
         });
      });

      it('reports an error if there is a "]", but there was no start token', () => {
         docTypeEnd.checkWellFormed(docTypeEndPToken, undefined as any, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: docTypeEndPToken.postCloseInternalSubsetSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token given a good parsing', () => {
         const makeSToken = makeSTokenMaker(undefined, 1, 0, 1);

         docTypeEndPToken.postCloseInternalSubsetSpace = makeSToken('\t');

         const token = docTypeEnd.pTokenToXToken(docTypeEndPToken);

         expect(token).toEqual(new docTypeEnd.XToken(docTypeEndPToken));
      });

   });

});
