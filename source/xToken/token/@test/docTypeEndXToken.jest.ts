/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { DocTypeEndPToken, DocTypeStartPToken } from 'token';

import { DocTypeEndXToken, DOCTYPE_END_XTOKEN } from '../docTypeEndXToken';

describe('DocTypeEndXToken (unit)', () => {
   let docTypeEndPToken: DocTypeEndPToken;

   beforeEach(() => {
      docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: new DocTypeStartPToken({ open: toSToken('<!') }),
         closeSubset: toSToken(']'),
         closeSubsetSpace: undefined,
         close: toSToken('>'),
      });
   });

   it('returns a token given PToken', () => {
      const token = new DocTypeEndXToken(docTypeEndPToken);

      expect(token).toEqual({
         type: DOCTYPE_END_XTOKEN,
         pToken: docTypeEndPToken,
      });
   });

   it('returns a token given no parameter', () => {
      const token = new DocTypeEndXToken();

      expect(token).toEqual({
         type: DOCTYPE_END_XTOKEN,
      });
   });
});
