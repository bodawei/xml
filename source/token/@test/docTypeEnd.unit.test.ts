/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError } from 'error';

import { DocTypeEndPToken, DocTypeEndXToken, parseDocTypeEnd } from '../docTypeEnd';
import { DocTypeStartPToken } from '../docTypeStart';

describe('docTypeEnd (unit)', () => {
   let startPToken: DocTypeStartPToken;
   let docTypeEndPToken: DocTypeEndPToken;

   beforeEach(() => {
      startPToken = new DocTypeStartPToken({ open: SToken.fromString('<!'), openSubset: true });
      const makeSToken = makeSTokenMaker();
      docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: startPToken,
         closeSubset: makeSToken(']'),
         closeSubsetSpace: undefined,
         close: makeSToken('>'),
      });
   });

   describe('parseDocTypeEnd()', () => {
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

         parseDocTypeEnd(mockSource, startPToken, callback);
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
         (docTypeEndPToken as any).closeSubsetSpace = makeSToken('\t');
         (docTypeEndPToken as any).close = makeSToken('>');

         parseDocTypeEnd(mockSource, startPToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(docTypeEndPToken);
      });

      it('copes with EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ]);
         (docTypeEndPToken as any).closeSubset = undefined;
         (docTypeEndPToken as any).closeSubsetSpace = undefined;
         (docTypeEndPToken as any).close = undefined;

         parseDocTypeEnd(mockSource, startPToken, callback);
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

      it('returns no errors if no problems ', () => {
         docTypeEndPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         (docTypeEndPToken as any).close = undefined;

         docTypeEndPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
            params: undefined,
            position: docTypeEndPToken.closeSubsetSpace,
         });
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete (docTypeStartPToken as any).startInternalSubset;

         docTypeEndPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: docTypeEndPToken.closeSubsetSpace,
         });
      });

      it('reports an error if there is a "]", but there was no start token', () => {
         docTypeEndPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: docTypeEndPToken.closeSubsetSpace,
         });
      });

   });

   describe('toXToken()', () => {

      it('returns a token given a good parsing', () => {
         const makeSToken = makeSTokenMaker(undefined, 1, 0, 1);

         (docTypeEndPToken as any).closeSubsetSpace = makeSToken('\t');

         const token = docTypeEndPToken.toXToken();

         expect(token).toEqual(new DocTypeEndXToken(docTypeEndPToken));
      });

   });

   describe('toStokenArray()', () => {

      it('returns the Stokens', () => {

            expect(docTypeEndPToken.toSTokenArray()).toEqual([
               docTypeEndPToken.closeSubset,
               docTypeEndPToken.close,
            ] as any);
      });

   });

});
