/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as text from './text.js';

describe('text (unit)', () => {
   let textPToken;

   beforeEach(() => {
      const makeToken = makeLTokenMaker();
      textPToken = {
         text: makeToken('foo'),
      };
   });


   describe('Token', () => {

      it('is constructed with value and LTokens', () => {
         const token = new text.Token('foo', [ textPToken.text ]);

         expect(token.text).toEqual('foo');
         expect(token.lTokens).toEqual([
            textPToken.text,
         ]);
      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parsing', () => {
         const mockSource = new MockLTokenSource([
            [ 'foo', 'all', [ 'x' ] ],
         ]);

         text.parse(mockSource, [ 'x' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(textPToken);
      });

   });

   describe('makeToken()', () => {

      it('converts a PToken to an XToken', () => {
         const token = text.makeToken(textPToken);

         expect(token).toEqual(new text.Token('foo', [ textPToken.text ]));
      });

   });

});
