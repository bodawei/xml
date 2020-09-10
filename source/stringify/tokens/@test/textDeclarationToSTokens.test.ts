/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { TextDeclarationPToken } from 'pToken';
import { SToken } from 'sToken';

import { InstructionStart } from '../../../token/bridge/instruction';
import * as entityInstr from '../../../token/common/entityInstruction';

import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

describe('textDeclarationToSTokens() (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         params: [
            {
               name: SToken.fromString('version'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
            },
         ],
         close: SToken.fromString('?>'),
      });

      start = {
         open: textDeclPToken.open,
         openSpace: undefined,
         target: textDeclPToken.target,
         targetSpace: textDeclPToken.targetSpace,
      };
   });

   it('calls entityInstruction.sTokensFromPToken', () => {
      const entitySpy = spyOn(entityInstr, 'sTokensFromPToken');

      textDeclarationToSTokens(textDeclPToken);

      expect(entitySpy).toHaveBeenCalledWith(textDeclPToken);
   });
});
