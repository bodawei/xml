/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { XmlDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { xmlDeclarationToSTokens } from '../xmlDeclarationToSTokens';
import * as entityInstr from '../../../token/common/entityInstruction';

describe('xmlDeclarationToSTokens (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         params: [
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

   it('calls entityInstruction.sTokensFromPToken', () => {
      const entitySpy = spyOn(entityInstr, 'sTokensFromPToken');

      xmlDeclarationToSTokens(xmlDeclPToken);

      expect(entitySpy).toHaveBeenCalledWith(xmlDeclPToken);
   });

});
