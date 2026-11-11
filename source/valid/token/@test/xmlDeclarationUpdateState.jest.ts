/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { XmlDeclarationPToken } from 'pToken';
import { makeXmlDecl } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { xmlDeclarationUpdateState } from '../xmlDeclarationUpdateState';

describe('xmlDeclarationUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState();
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
         close: toSToken('?>'),
         fields: [
            {
               equal: toSToken('='),
               equalSpace: undefined,
               name: toSToken('standalone'),
               nameSpace: undefined,
               value: toSToken('yes'),
            },
         ],
         open: toSToken('<?'),
      });

      const newState = xmlDeclarationUpdateState(xmlDecl, state);

      expect(newState).toEqual({
         ...state,
         isStandalone: true,
      });
   });
});
