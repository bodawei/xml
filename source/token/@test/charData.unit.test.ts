/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */


import { makeSTokenMaker, MockSTokenSource } from 'pToken-test';

import { CharDataPToken, parseCharData } from '../charData';

describe('charData', () => {
   let charDataPToken: CharDataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      charDataPToken = new CharDataPToken({
         text: expectedSToken('test text'),
      });
   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>' ] ],
         ]);

         parseCharData(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('responds to other terminators passed in', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>', '$' ] ],
         ]);

         parseCharData(mockSource, [ '$' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('returns undefined if no text returned', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         parseCharData(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)).toEqual([ undefined ]);
      });
   });

});
