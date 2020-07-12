/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { CharRefPToken, parseCharRef } from '../charRef';

describe('charRef (unit)', () => {
   let charRefPToken: CharRefPToken;
   let openSToken: SToken;

   beforeEach(() => {
      openSToken = toSToken('&#');

      charRefPToken = new CharRefPToken({
         open: openSToken,
         digits: toSToken('1234'),
         close: toSToken(';'),
         charCode: 1234,
      });
   });

   describe('parseCharRef()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('extracts properties of a decimal character reference', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            [undefined, 'multi', ['x', 'X']],
            [undefined, 'space'],
            ['1234', 'digit', 10],
            [undefined, 'space'],
            [';', 'match', ';'],
         ]);

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(charRefPToken);
      });

      it('extracts properties of a hexadecimal character reference', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['x', 'multi', ['x', 'X']],
            [undefined, 'space'],
            ['1f2', 'digit', 16],
            [undefined, 'space'],
            [';', 'match', ';'],
         ]);

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(
            new CharRefPToken({
               open: openSToken,
               hexMarker: toSToken('x'),
               digits: toSToken('1f2'),
               close: toSToken(';'),
               charCode: 498,
            }),
         );
      });

      it('extracts properties of a char ref with many invalid spaces', () => {
         const mockSource = new MockSTokenSource([
            [' ', 'space'],
            ['x', 'multi', ['x', 'X']],
            [' ', 'space'],
            ['1f2', 'digit', 16],
            [' ', 'space'],
            [';', 'match', ';'],
         ]);
         charRefPToken = new CharRefPToken({
            open: openSToken,
            openSpace: toSToken(' '),
            hexMarker: toSToken('x'),
            hexMarkerSpace: toSToken(' '),
            digits: toSToken('1f2'),
            digitsSpace: toSToken(' '),
            close: toSToken(';'),
            charCode: 498,
         });

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(charRefPToken);
      });

      it('extracts a character in the astral plane', () => {
         const mockSource = new MockSTokenSource([
            [' ', 'space'],
            ['x', 'multi', ['x', 'X']],
            [' ', 'space'],
            ['1F600', 'digit', 16],
            [' ', 'space'],
            [';', 'match', ';'],
         ]);
         charRefPToken = new CharRefPToken({
            open: openSToken,
            openSpace: toSToken(' '),
            hexMarker: toSToken('x'),
            hexMarkerSpace: toSToken(' '),
            digits: toSToken('1F600'),
            digitsSpace: toSToken(' '),
            close: toSToken(';'),
            charCode: 0x1f600,
         });

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(charRefPToken);
      });
   });
});
