/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import { DocTypeEndPToken, parseDocTypeEnd } from '../docTypeEnd';
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

   describe('toStokenArray()', () => {

      it('returns the Stokens', () => {

            expect(docTypeEndPToken.toSTokenArray()).toEqual([
               docTypeEndPToken.closeSubset,
               docTypeEndPToken.close,
            ] as any);
      });

   });

});
