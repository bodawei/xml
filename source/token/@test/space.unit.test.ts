/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import { SpacePToken, parseSpace } from '../space';

describe('space (unit)', () => {
   let spacePToken: SpacePToken;
   let makeSToken: STokenMaker;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      spacePToken = new SpacePToken({
         text: makeSToken(' '),
      });
   });

   describe('toStokenArray()', () => {

      it('returns all the STokens', () => {
         expect(spacePToken.toSTokenArray()).toEqual([
            spacePToken.text,
         ]);
      });

   });

   describe('parseSpace()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parseSpace', () => {
         const mockSource = new MockSTokenSource([
            [ ' ', 'space', undefined ],
         ]);

         parseSpace(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(spacePToken);
      });

      it('copes with EOF', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space', undefined ],
         ]);

         parseSpace(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)).toEqual([ undefined ]);
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns space token with the whitespace', () => {
         const token = spacePToken.toXToken();

         expect(token.text).toEqual(' ');
      });

   });

});
