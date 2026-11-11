/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { UNKNOWNDECL_PTOKEN, DeclarationPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { unknownDeclarationToSTokens } from '../unknownDeclarationToSTokens';

describe('unknownDeclarationToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      const declarationPToken = new DeclarationPToken(UNKNOWNDECL_PTOKEN, {
         open: toSToken('<!'),
         postOpenSpace: toSToken(' '),
         declType: toSToken('DOCTYPE'),
         postDeclTypeSpace: toSToken('\t'),
      });

      expect(unknownDeclarationToSTokens(declarationPToken)).toEqual([
         declarationPToken.open,
         declarationPToken.postOpenSpace,
         declarationPToken.declType,
         declarationPToken.postDeclTypeSpace,
      ]);
   });
});
