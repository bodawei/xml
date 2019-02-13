/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import { TextPToken, TextXToken, parseText } from '../text';

describe('text (unit)', () => {
   let textPToken: TextPToken;

   beforeEach(() => {
      const makeToken = makeSTokenMaker();
      textPToken = new TextPToken({
         text: makeToken('foo'),
      });
   });

   describe('Token', () => {

      it('is constructed with value and STokens', () => {
         const token = new TextXToken('foo', textPToken);

         expect(token.text).toEqual('foo');
         expect(token.pToken).toEqual(textPToken);
      });

   });

   describe('PToken', () => {

      describe('toSTokenArray()', () => {

         it('returns all the STokens', () => {
            expect(textPToken.toSTokenArray()).toEqual([
               textPToken.text,
            ] as Array<SToken>);
         });

      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parsing', () => {
         const mockSource = new MockSTokenSource([
            [ 'foo', 'all', [ 'x' ] ],
         ]);

         parseText(mockSource, [ 'x' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(textPToken);
      });

      it('returns no token if it is at EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         parseText(mockSource, [ 'x' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)).toEqual([ undefined ]);
      });

   });

   describe('toXToken()', () => {

      it('converts a PToken to an XToken', () => {
         const token = textPToken.toXToken();

         expect(token).toEqual(new TextXToken('foo', textPToken));
      });

   });

});
