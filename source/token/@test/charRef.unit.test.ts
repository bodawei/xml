/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError, XmlWarning } from 'error';

import {
   CharRefPToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
   sTokensFromPToken,
} from '../charRef';

describe('charRef (unit)', () => {
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
            [ undefined, 'space' ],
            [ undefined, 'multi', [ 'x', 'X' ] ],
            [ undefined, 'space' ],
            [ '1234', 'digit', 10 ],
            [ undefined, 'space' ],
            [ ';', 'match', ';' ],
         ]);

         parse(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charRefPToken);
      });

      it('extracts properties of a hexadecimal character reference', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'x', 'multi', [ 'x', 'X' ] ],
            [ undefined, 'space' ],
            [ '1f2', 'digit', 16 ],
            [ undefined, 'space' ],
            [ ';', 'match', ';' ],
         ]);
         charRefPToken.digits = new SToken('1f2', '1f2', new Range(new EntityLocation(), 1, 0, 1, 4, 0, 4));
         charRefPToken.charCode = 498;

         parse(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charRefPToken);
      });

      it('extracts properties of a char ref with many invalid spaces', () => {
         const mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'x', 'multi', [ 'x', 'X' ] ],
            [ ' ', 'space' ],
            [ '1f2', 'digit', 16 ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);
         const makeSToken = makeSTokenMaker();
         charRefPToken = new CharRefPToken({
            open: openSToken,
            postOpenSpace: makeSToken(' '),
            hexMarker: makeSToken('x'),
            postHexMarkerSpace: makeSToken(' '),
            digits: makeSToken('1f2'),
            postDigitsSpace: makeSToken(' '),
            close: makeSToken(';'),
         });

         parse(mockSource, openSToken, callback);
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
      });

      it('reports no errors if no pToken provided', () => {
         checkWellFormed(undefined, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if there is a space after the open', () => {
         charRefPToken.postOpenSpace = SToken.fromString(' ');

         charRefPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_OPEN_SPACE,
            params: undefined,
            position: charRefPToken.postOpenSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error if the "x" is capitalized', () => {
         charRefPToken.hexMarker = SToken.fromString('X');

         checkWellFormed(charRefPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_INVALID_HEX_CASE,
            params: undefined,
            position: charRefPToken.hexMarker,
            lastPosition: undefined,
         });
      });

      it('reports an error when there is a space after the "x"', () => {
         charRefPToken.postHexMarkerSpace = SToken.fromString(' ');

         checkWellFormed(charRefPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_HEX_SPACE,
            params: undefined,
            position: charRefPToken.postHexMarkerSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error if there are no digits', () => {
         charRefPToken.digits = undefined;

         checkWellFormed(charRefPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_NO_DIGITS,
            params: undefined,
            position: undefined,
            lastPosition: charRefPToken.open,
         });
      });

      it('reports an error when there is a space after the digits', () => {
         charRefPToken.postDigitsSpace = SToken.fromString(' ');

         checkWellFormed(charRefPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARREF_XTRA_POST_DIGITS_SPACE,
            params: undefined,
            position: charRefPToken.postDigitsSpace,
            lastPosition: undefined,
         });
      });

      it('reports an error when there is no close', () => {
         charRefPToken.close = undefined;

         checkWellFormed(charRefPToken, mockErrorCollector, emd);

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
         const xToken = pTokenToXToken(charRefPToken);

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: String.fromCharCode(1234),
            pToken: charRefPToken,
         });
      });

      it('creates an XToken when there are no digits', () => {
         delete charRefPToken.digits;

         const xToken = pTokenToXToken(charRefPToken);

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: ' ',
            pToken: charRefPToken,
         });
      });

      it('creates an XToken when the digits are hex', () => {
         charRefPToken.hexMarker = SToken.fromString('X');
         charRefPToken.digits = SToken.fromString('41'); // A in hex, ) in decimal

         const xToken = pTokenToXToken(charRefPToken);

         expect(xToken).toEqualProps({
            type: 'CHARREF_XTOKEN',
            char: 'A',
            pToken: charRefPToken,
         });
      });
   });

   describe('sTokensFromPToken()', () => {

      it('returns all tokens', () => {
         charRefPToken.postOpenSpace = SToken.fromString(' ');
         charRefPToken.hexMarker = SToken.fromString(' ');
         charRefPToken.postHexMarkerSpace = SToken.fromString(' ');
         charRefPToken.postDigitsSpace = SToken.fromString(' ');

         const sTokens = sTokensFromPToken(charRefPToken);

         expect(sTokens).toEqual([
            charRefPToken.open,
            charRefPToken.postOpenSpace,
            charRefPToken.hexMarker,
            charRefPToken.postHexMarkerSpace,
            charRefPToken.digits,
            charRefPToken.postDigitsSpace,
            charRefPToken.close,
         ] as Array<SToken>); // typeHack
      });

   });

});
