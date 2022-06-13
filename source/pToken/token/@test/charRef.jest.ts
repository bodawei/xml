/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

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

   describe('cnostruction', () => {
      it('will override all properties on the source', () => {
         const source = new CharRefPToken({
            open: openSToken,
            openSpace: toSToken(' '),
            hexMarker: toSToken('x'),
            hexMarkerSpace: toSToken(' '),
            digits: toSToken('1f2'),
            digitsSpace: toSToken(' '),
            close: toSToken(';'),
         });

         const result = new CharRefPToken(source, {
            open: undefined,
            openSpace: undefined,
            hexMarker: undefined,
            hexMarkerSpace: undefined,
            digits: undefined,
            digitsSpace: undefined,
            close: undefined,
         });

         expect(result).toEqualRangeless({
            open: openSToken,
            openSpace: undefined,
            hexMarker: undefined,
            hexMarkerSpace: undefined,
            digits: undefined,
            digitsSpace: undefined,
            close: undefined,
            charCode: 0,
            char: '',
         });
      });
   });

   describe('parseCharRef()', () => {
      let result: CharRefPToken | undefined;

      function getResult(output: CharRefPToken | undefined): void {
         result = output;
      }

      it('extracts properties of a decimal character reference', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            [undefined, 'multi', ['x', 'X']],
            [undefined, 'space'],
            ['1234', 'digit', 10],
            [undefined, 'space'],
            [';', 'match', ';'],
         ]);

         parseCharRef(mockSource, openSToken, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(charRefPToken);
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

         parseCharRef(mockSource, openSToken, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new CharRefPToken({
               open: openSToken,
               hexMarker: toSToken('x'),
               digits: toSToken('1f2'),
               close: toSToken(';'),
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
         });

         parseCharRef(mockSource, openSToken, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(charRefPToken);
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
         });

         parseCharRef(mockSource, openSToken, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(charRefPToken);
      });

      it('sets charCode and char even when digits is undefined', () => {
         const mockSource = new MockSTokenSource([
            [' ', 'space'],
            ['x', 'multi', ['x', 'X']],
            [' ', 'space'],
            [undefined, 'digit', 16],
            [' ', 'space'],
            [';', 'match', ';'],
         ]);

         parseCharRef(mockSource, openSToken, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new CharRefPToken({
               open: openSToken,
               openSpace: toSToken(' '),
               hexMarker: toSToken('x'),
               hexMarkerSpace: toSToken(' '),
               digitsSpace: toSToken(' '),
               close: toSToken(';'),
            }),
         );
      });
   });
});
