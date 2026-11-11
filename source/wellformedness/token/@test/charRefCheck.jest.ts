/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, extractSurrogatePair, isChar } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { CharRefPToken } from 'pToken';
import { makeCharRef } from 'token-test';
import { vi, type Mock } from 'vitest';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { charRefCheck } from '../charRefCheck';

vi.mock('basic', async () => {
   const basicOriginal = (await vi.importActual('basic')) as Record<string, unknown>;

   return {
      ...basicOriginal,
      extractSurrogatePair: vi.fn(),
      isChar: vi.fn(),
   };
});

const WFEID = wellFormedErrorCodes.id;

describe('charRefCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let charRefPToken: CharRefPToken;

   beforeEach(() => {
      collector = new ParamCollector();
      confVer = new ConformanceVersion(1, 2);

      (extractSurrogatePair as Mock).mockReturnValue([123, 456]);

      charRefPToken = makeCharRef();
   });

   it('calls the isChar() routine with the version and code it was given (WFC §4.1.0)', () => {
      charRefPToken = new CharRefPToken({
         charCode: 66,
         digits: toSToken('66'),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      expect(isChar).toHaveBeenCalledWith('\u0042', 1.0);
   });

   it('reports an error if the character is not a valid Char (WFC §4.1.0)', () => {
      (isChar as Mock).mockReturnValue(false);
      charRefPToken = new CharRefPToken({
         charCode: 0xffff,
         digits: toSToken('65535'),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_INVALID_CHAR,
         lastPosition: undefined,
         params: ['65535'],
         position: charRefPToken.digits,
      });
   });

   it('reports an error if the character is not a valid Char (WFC §4.1.0)', () => {
      (isChar as Mock).mockReturnValue(false);
      charRefPToken = new CharRefPToken({
         charCode: 0x1f026,
         digits: toSToken('1F026'),
         hexMarker: toSToken('x'),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_INVALID_CHAR,
         lastPosition: undefined,
         params: ['x1F026'],
         position: charRefPToken.digits,
      });
   });

   it('reports an error if there is a space after the open (syntax)', () => {
      charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         openSpace: toSToken(' '),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_XTRA_POST_OPEN_SPACE,
         lastPosition: undefined,
         params: [],
         position: charRefPToken.openSpace,
      });
   });

   it('reports an error if the "x" is capitalized (syntax)', () => {
      charRefPToken = new CharRefPToken({
         hexMarker: toSToken('X'),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_INVALID_HEX_CASE,
         lastPosition: undefined,
         params: [],
         position: charRefPToken.hexMarker,
      });
   });

   it('reports an error when there is a space after the "x" (syntax)', () => {
      charRefPToken = new CharRefPToken({
         hexMarkerSpace: toSToken(' '),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_XTRA_POST_HEX_SPACE,
         lastPosition: undefined,
         params: [],
         position: charRefPToken.hexMarkerSpace,
      });
   });

   it('reports an error if there are no digits (syntax)', () => {
      charRefPToken = new CharRefPToken({
         digits: undefined,
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_NO_DIGITS,
         lastPosition: charRefPToken.open,
         params: [],
         position: undefined,
      });
   });

   it('reports an error when there is a space after the digits (syntax)', () => {
      charRefPToken = new CharRefPToken({
         digitsSpace: toSToken(' '),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_XTRA_POST_DIGITS_SPACE,
         lastPosition: undefined,
         params: [],
         position: charRefPToken.digitsSpace,
      });
   });

   it('reports an error when there is no close (syntax)', () => {
      charRefPToken = new CharRefPToken({
         close: undefined,
         digits: toSToken('34'),
         open: toSToken('&#'),
      });

      charRefCheck(charRefPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARREF_NO_CLOSE,
         lastPosition: charRefPToken.digits,
         params: [],
         position: undefined,
      });
   });
});
