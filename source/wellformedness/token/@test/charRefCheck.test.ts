/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from 'error-test';
import { WellFormedError } from 'error';
import { toSToken } from 'sToken';
import { CharRefPToken } from 'token';
import { makeCharRef } from 'token-test';

import * as basic from 'basic';

import { charRefCheck } from '../charRefCheck';

describe('charRefCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let emd: EntityMetaData;
   let charRefPToken: CharRefPToken;
   let isCharSpy: jasmine.Spy;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      emd = new EntityMetaData();
      charRefPToken = makeCharRef();

      isCharSpy = spyOn(basic, 'isChar');
   });

   it('calls the isChar() routine with the version and code it was given (WFC §4.1.0)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('66'),
         charCode: 66,
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(isCharSpy).toHaveBeenCalledWith('\u0042', 1.0);
   });

   it('reports an error if the character is not a valid Char (WFC §4.1.0)', () => {
      isCharSpy.and.returnValue(false);
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('65535'),
         charCode: 0xffff,
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_INVALID_CHAR,
         params: ['65535'],
         position: charRefPToken.digits,
         lastPosition: undefined,
      });
   });

   it('reports an error if there is a space after the open (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         openSpace: toSToken(' '),
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_XTRA_POST_OPEN_SPACE,
         params: undefined,
         position: charRefPToken.openSpace,
         lastPosition: undefined,
      });
   });

   it('reports an error if the "x" is capitalized (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         hexMarker: toSToken('X'),
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_INVALID_HEX_CASE,
         params: undefined,
         position: charRefPToken.hexMarker,
         lastPosition: undefined,
      });
   });

   it('reports an error when there is a space after the "x" (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         hexMarkerSpace: toSToken(' '),
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_XTRA_POST_HEX_SPACE,
         params: undefined,
         position: charRefPToken.hexMarkerSpace,
         lastPosition: undefined,
      });
   });

   it('reports an error if there are no digits (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         digits: undefined,
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_NO_DIGITS,
         params: undefined,
         position: undefined,
         lastPosition: charRefPToken.open,
      });
   });

   it('reports an error when there is a space after the digits (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         digitsSpace: toSToken(' '),
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_XTRA_POST_DIGITS_SPACE,
         params: undefined,
         position: charRefPToken.digitsSpace,
         lastPosition: undefined,
      });
   });

   it('reports an error when there is no close (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('34'),
         close: undefined,
      });

      charRefCheck(charRefPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CHARREF_NO_CLOSE,
         params: undefined,
         position: undefined,
         lastPosition: charRefPToken.digits,
      });
   });
});
