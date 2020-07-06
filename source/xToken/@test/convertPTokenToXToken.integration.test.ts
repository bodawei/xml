/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { makeTextDecl, makeXmlDecl } from 'token-test';
import { TEXTDECL_XTOKEN, XMLDECL_XTOKEN } from 'xToken';

import { convertPTokenToXToken } from '../convertPTokenToXToken';

describe('convertPTokenToXToken() (integration)', () => {
   it('converts an Text Declaration', () => {
      const pToken = makeTextDecl();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(TEXTDECL_XTOKEN);
   });

   it('converts an XML Declaration', () => {
      const pToken = makeXmlDecl();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(XMLDECL_XTOKEN);
   });
});
