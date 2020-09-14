/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { TextDeclarationPToken } from 'pToken';

import { TextDeclarationXToken } from '../textDeclarationXToken';

describe('TextDeclarationXToken()', () => {
   let textDeclPToken;

   it('sets all parameters using the input', () => {
      textDeclPToken = new TextDeclarationPToken({
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

      expect(result).toEqual(new TextDeclarationXToken(1.0, 'UTF-99', textDeclPToken));
   });

   it('sets version to 1.1 if that is what is passed in', () => {
      textDeclPToken = new TextDeclarationPToken({
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

      expect(result).toEqual(new TextDeclarationXToken(1.1, undefined, textDeclPToken));
   });

   it('sets default parameters when input has none', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      const result = new TextDeclarationXToken(textDeclPToken);

      expect(result).toEqual(new TextDeclarationXToken(1.0, 'utf-8', textDeclPToken));
   });

   it('sets default values when input values are erronious', () => {
      textDeclPToken = new TextDeclarationPToken({
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

      expect(result).toEqual(new TextDeclarationXToken(1.0, 'some-encoding', textDeclPToken));
   });

   it('treats a mis-cased standalone as the correct case', () => {
      textDeclPToken = new TextDeclarationPToken({
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

      expect(result).toEqual(new TextDeclarationXToken(1.0, 'some-encoding', textDeclPToken));
   });
});
