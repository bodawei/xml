/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { XmlDeclarationPToken } from 'pToken';

import { fieldedInstructionToSTokens } from '../../common/fieldedInstructionToSTokens';
import { xmlDeclarationToSTokens } from '../xmlDeclarationToSTokens';

jest.mock('../../common/fieldedInstructionToSTokens');

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
      (fieldedInstructionToSTokens as jest.Mock).mockReturnValue([toSToken('field')]);

      const result = xmlDeclarationToSTokens(xmlDeclPToken);

      expect(result).toEqual([toSToken('field')]);
   });
});
