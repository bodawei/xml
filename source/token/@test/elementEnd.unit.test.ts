/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import misc from '../common/misc';
import { ElementEndPToken, parseElementEnd } from '../elementEnd';

describe('elementEnd', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new ElementEndPToken({
         open: makeSToken('</'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('parseElementEnd()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns a common parsing', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 2, 0, 2);

         parseElementEnd(mockSource, elementEndPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEndPToken);
      });

      it('no values if at the end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);
         (elementEndPToken as any).name = undefined;
         (elementEndPToken as any).nameSpace = undefined;
         (elementEndPToken as any).close = undefined;

         parseElementEnd(mockSource, elementEndPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEndPToken);
      });

   });

   describe('toXToken()', () => {

      it('returns a token with an empty string if no name was found', () => {
         (elementEndPToken as any).name = undefined;

         const token = elementEndPToken.toXToken();

         expect(token.name).toEqual('');
      });

   });

   describe('toSTokenArray()', () => {

      it('returns all the STokens', () => {
         expect(elementEndPToken.toSTokenArray()).toEqual([
            elementEndPToken.open!,
            elementEndPToken.name!,
            elementEndPToken.nameSpace!,
            elementEndPToken.close!,
         ]);
      });

   });

});
