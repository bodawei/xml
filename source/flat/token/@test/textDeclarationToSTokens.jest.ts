/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { TextDeclarationPToken } from 'pToken';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { fieldedInstructionToSTokens } from '../../common/fieldedInstructionToSTokens';
import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

vi.mock('../../common/fieldedInstructionToSTokens');

describe('textDeclarationToSTokens() (integration)', () => {
   it('returns the STokens', () => {
      (fieldedInstructionToSTokens as Mock).mockReturnValue([toSToken('fields')]);
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
            },
         ],
         close: toSToken('?>'),
      });

      const result = textDeclarationToSTokens(textDeclPToken);

      expect(result).toEqual([toSToken('fields')]);
   });
});
