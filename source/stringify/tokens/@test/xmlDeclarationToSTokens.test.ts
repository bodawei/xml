/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { xmlDeclarationToSTokens } from '../xmlDeclarationToSTokens';

import * as fieldedInstr from '../common/fieldedInstructionToSTokens';

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
      const entitySpy = spyOn(fieldedInstr, 'fieldedInstructionToSTokens');

      xmlDeclarationToSTokens(xmlDeclPToken);

      expect(entitySpy).toHaveBeenCalledWith(xmlDeclPToken);
   });
});
