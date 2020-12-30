/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeXmlDecl } from 'token-test';

import { ValidateState } from '../../validateState';
import { xmlDeclarationUpdateState } from '../xmlDeclarationUpdateState';

describe('xmlDeclarationUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState();
   });

   it('sets standalone to be false if the xml declaration is not standalone', () => {
      const xmlDecl = makeXmlDecl();

      const newState = xmlDeclarationUpdateState(xmlDecl, state);

      expect(newState).toEqual({
         ...state,
         isStandalone: false,
      });
   });

   it('sets standalone to be true if the xml declaration is standalone', () => {
      const xmlDecl = new XmlDeclarationPToken({
         open: toSToken('<?'),
         fields: [
            {
               name: toSToken('standalone'),
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
               value: toSToken('yes'),
            },
         ],
         close: toSToken('?>'),
      });

      const newState = xmlDeclarationUpdateState(xmlDecl, state);

      expect(newState).toEqual({
         ...state,
         isStandalone: true,
      });
   });
});
