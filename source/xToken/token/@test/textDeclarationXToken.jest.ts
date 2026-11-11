/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { TextDeclarationPToken } from 'pToken';

import { TextDeclarationXToken, TEXTDECL_XTOKEN } from '../textDeclarationXToken';

describe('TextDeclarationXToken()', () => {
   it('can be constructed with literal values', () => {
      const result = new TextDeclarationXToken(1.0, 'UTF-99');

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.0,
         encoding: 'UTF-99',
      });
   });

   it('sets all parameters using the input', () => {
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
            {
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('UTF-99'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.0,
         encoding: 'UTF-99',
         pToken: textDeclPToken,
      });
   });

   it('sets version to 1.1 if that is what is passed in', () => {
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('1.1'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.1,
         encoding: 'utf-8',
         pToken: textDeclPToken,
      });
   });

   it('sets default parameters when input has none', () => {
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.0,
         encoding: 'utf-8',
         pToken: textDeclPToken,
      });
   });

   it('sets default values when input values are erronious', () => {
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('1.2'),
            },
            {
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('some-encoding'),
            },
            {
               name: toSToken('standalone'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('bogus'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.0,
         encoding: 'some-encoding',
         pToken: textDeclPToken,
      });
   });

   it('treats a mis-cased standalone as the correct case', () => {
      const textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('1.2'),
            },
            {
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('some-encoding'),
            },
            {
               name: toSToken('standalone'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('YES'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual({
         type: TEXTDECL_XTOKEN,
         version: 1.0,
         encoding: 'some-encoding',
         pToken: textDeclPToken,
      });
   });
});
