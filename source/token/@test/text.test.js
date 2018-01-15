/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import text from '../text.js';

describe('text (unit)', () => {
   let textPToken;

   beforeEach(() => {
      const makeToken = makeSTokenMaker();
      textPToken = new text.PToken({
         text: makeToken('foo'),
      });
   });

   describe('Token', () => {

      it('is constructed with value and STokens', () => {
         const token = new text.XToken('foo', [ textPToken.text ]);

         expect(token.text).toEqual('foo');
         expect(token.pToken).toEqual([
            textPToken.text,
         ]);
      });

   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(textPToken.getSTokenArray()).toEqual([
               textPToken.text,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parsing', () => {
         const mockSource = new MockSTokenSource([
            [ 'foo', 'all', [ 'x' ] ],
         ]);

         text.parse(mockSource, [ 'x' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(textPToken);
      });

   });

   describe('makeXToken()', () => {

      it('converts a PToken to an XToken', () => {
         const token = text.makeXToken(textPToken);

         expect(token).toEqual(new text.XToken('foo', textPToken));
      });

   });

});
