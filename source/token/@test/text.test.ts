/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import text from '../text';
import { TextPToken, TextXToken } from '../text';
import { SToken } from 'sToken';

describe('text (unit)', () => {
   let textPToken: TextPToken;

   beforeEach(() => {
      const makeToken = makeSTokenMaker();
      textPToken = new text.PToken({
         text: makeToken('foo'),
      });
   });

   describe('Token', () => {

      it('is constructed with value and STokens', () => {
         const token = new text.XToken('foo', textPToken);

         expect(token.text).toEqual('foo');
         expect(token.pToken).toEqual(textPToken);
      });

   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(textPToken.getSTokenArray()).toEqual([
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

      it('converts a PToken with no text into an XToken with a ""', () => {
         delete textPToken.text;
         const token = text.makeXToken(textPToken);

         expect(token).toEqual(new text.XToken('', textPToken));
      });

   });

});
