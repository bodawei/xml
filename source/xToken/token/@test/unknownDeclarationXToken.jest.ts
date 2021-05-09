/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { DeclarationPToken } from 'token';

import { UNKNOWN_DECLARATION_XTOKEN, UnknownDeclarationXToken } from '../unknownDeclarationXToken';

describe('UnknownDeclarationXToken (unit)', () => {
   let declaration: DeclarationPToken;

   beforeEach(() => {
      declaration = new DeclarationPToken('foo', {});
   });

   it('returns an unknown declaration', () => {
      const result = new UnknownDeclarationXToken(declaration);

      expect(result).toEqual({
         type: UNKNOWN_DECLARATION_XTOKEN,
         pToken: declaration,
      });
   });
});
