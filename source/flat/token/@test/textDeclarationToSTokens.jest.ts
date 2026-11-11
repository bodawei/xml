/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { TextDeclarationPToken } from 'pToken';

import { fieldedInstructionToSTokens } from '../../common/fieldedInstructionToSTokens';
import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

jest.mock('../../common/fieldedInstructionToSTokens');

describe('textDeclarationToSTokens() (integration)', () => {
   it('returns the STokens', () => {
      (fieldedInstructionToSTokens as jest.Mock).mockReturnValue([toSToken('fields')]);
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
