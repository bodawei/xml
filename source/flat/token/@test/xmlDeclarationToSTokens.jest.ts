/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { XmlDeclarationPToken } from 'pToken';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { fieldedInstructionToSTokens } from '../../common/fieldedInstructionToSTokens';
import { xmlDeclarationToSTokens } from '../xmlDeclarationToSTokens';

vi.mock('../../common/fieldedInstructionToSTokens');

describe('xmlDeclarationToSTokens (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
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
   });

   it('calls fieldedInstructionToSTokens()', () => {
      xmlDeclarationToSTokens(xmlDeclPToken);

      expect(fieldedInstructionToSTokens).toHaveBeenCalledWith(xmlDeclPToken);
   });

   it('returns the result of fieldedInstructionToSTokens()', () => {
      (fieldedInstructionToSTokens as Mock).mockReturnValue([toSToken('field')]);

      const result = xmlDeclarationToSTokens(xmlDeclPToken);

      expect(result).toEqual([toSToken('field')]);
   });
});
