/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import * as basic from 'basic';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError, XmlWarning } from 'error';

import {
   CharRefPToken,
   parseCharRef,
} from '../charRef';

fdescribe('charRef (unit)', () => {
   let charRefPToken: CharRefPToken;
   let openSToken: SToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      openSToken = SToken.fromString('&#');

      charRefPToken = new CharRefPToken({
         open: openSToken,
         digits: makeSToken('1234'),
         close: makeSToken(';'),
         charCode: 1234,
      });
   });

   describe('parse()', () => {
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

         expect(callback).toContainPTokenProps(charRefPToken);
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
         (charRefPToken as any).digits = new SToken('1f2', '1f2', new Range(new EntityLocation(), 1, 0, 1, 4, 0, 4));
         (charRefPToken as any).charCode = 498;

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charRefPToken);
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
         const makeSToken = makeSTokenMaker();
         charRefPToken = new CharRefPToken({
            open: openSToken,
            openSpace: makeSToken(' '),
            hexMarker: makeSToken('x'),
            hexMarkerSpace: makeSToken(' '),
            digits: makeSToken('1f2'),
            digitsSpace: makeSToken(' '),
            close: makeSToken(';'),
            charCode: 498,
         });

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charRefPToken);
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
         const makeSToken = makeSTokenMaker();
         charRefPToken = new CharRefPToken({
            open: openSToken,
            openSpace: makeSToken(' '),
            hexMarker: makeSToken('x'),
            hexMarkerSpace: makeSToken(' '),
            digits: makeSToken('1F600'),
            digitsSpace: makeSToken(' '),
            close: makeSToken(';'),
            charCode: 0x1F600,
         });

         parseCharRef(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charRefPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(basic, 'isChar');
      });

      it('reports an error if the character is not a legal Char', () => {
         (charRefPToken as any).charCode = 0;

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(basic.isChar).toHaveBeenCalledWith('\u0000', 1.0);
      });

      it('reports an error if the character is not a valid Char', () => {
         (charRefPToken as any).charCode = 0xFFFF;

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_INVALID_CHAR,
            params: ['65535'],
            position: charRefPToken.digits,
            lastPosition: undefined,
         });
      });

      it('reports an error if there is a space after the open', () => {
         (charRefPToken as any).openSpace = SToken.fromString(' ');

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_OPEN_SPACE,
            params: undefined,
            position: charRefPToken.openSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error if the "x" is capitalized', () => {
         (charRefPToken as any).hexMarker = SToken.fromString('X');

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_INVALID_HEX_CASE,
            params: undefined,
            position: charRefPToken.hexMarker,
            lastPosition: undefined,
         });
      });

      it('reports an error when there is a space after the "x"', () => {
         (charRefPToken as any).hexMarkerSpace = SToken.fromString(' ');

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_HEX_SPACE,
            params: undefined,
            position: charRefPToken.hexMarkerSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error if there are no digits', () => {
         (charRefPToken as any).digits = undefined;

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_NO_DIGITS,
            params: undefined,
            position: undefined,
            lastPosition: charRefPToken.open,
         });
      });

      it('reports an error when there is a space after the digits', () => {
         (charRefPToken as any).digitsSpace = SToken.fromString(' ');

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_DIGITS_SPACE,
            params: undefined,
            position: charRefPToken.digitsSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error when there is no close', () => {
         (charRefPToken as any).close = undefined;

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: charRefPToken.digits,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('creates an XToken', () => {
         const xToken = charRefPToken.toXToken();

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: String.fromCharCode(1234),
            pToken: charRefPToken,
         });
      });

      it('creates an XToken when there are no digits', () => {
         delete (charRefPToken as any).digits;

         const xToken = charRefPToken.toXToken();

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: ' ',
            pToken: charRefPToken,
         });
      });

      it('creates an XToken when the digits are hex', () => {
         (charRefPToken as any).hexMarker = SToken.fromString('X');
         (charRefPToken as any).digits = SToken.fromString('41'); // A in hex, ) in decimal

         const xToken = charRefPToken.toXToken();

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: 'A',
            pToken: charRefPToken,
         });
      });

      it('creates an XToken from an astral plane character', () => {
         (charRefPToken as any).hexMarker = SToken.fromString('X');
         (charRefPToken as any).digits = SToken.fromString('1F026'); // https://codepoints.net/U+1F026

         const xToken = charRefPToken.toXToken();

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: '🀦', // This is actually two entties in the utf8 array.
            pToken: charRefPToken,
         });
      });
   });

   describe('sTokensFromPToken()', () => {

      it('returns all tokens', () => {
         (charRefPToken as any).openSpace = SToken.fromString(' ');
         (charRefPToken as any).hexMarker = SToken.fromString(' ');
         (charRefPToken as any).hexMarkerSpace = SToken.fromString(' ');
         (charRefPToken as any).digitsSpace = SToken.fromString(' ');

         const sTokens = charRefPToken.toSTokenArray();

         expect(sTokens).toEqual([
            charRefPToken.open,
            charRefPToken.openSpace,
            charRefPToken.hexMarker,
            charRefPToken.hexMarkerSpace,
            charRefPToken.digits,
            charRefPToken.digitsSpace,
            charRefPToken.close,
         ] as Array<SToken>); // typeHack
      });

   });

});
