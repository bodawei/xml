/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { TextDeclarationPToken } from 'pToken';
import { SToken } from 'sToken';

import * as fieldedInstr from '../../common/fieldedInstructionToSTokens';
import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

describe('textDeclarationToSTokens() (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [
            {
               name: SToken.fromString('version'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
            },
         ],
         close: SToken.fromString('?>'),
      });
   });

   it('calls fieldedInstructionToSTokens()', () => {
      const entitySpy = jest.spyOn(fieldedInstr, 'fieldedInstructionToSTokens');

      textDeclarationToSTokens(textDeclPToken);

      expect(entitySpy).toHaveBeenCalledWith(textDeclPToken);
   });
});
