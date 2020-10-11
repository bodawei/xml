/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { XmlDeclarationXToken } from '../xmlDeclarationXToken';

describe('XmlDeclarationXToken()', () => {
   let xmlDeclPToken: XmlDeclarationPToken;

   it('sets all parameters using the input', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
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
            {
               name: toSToken('standalone'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('yes'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual(new XmlDeclarationXToken(1.0, 'UTF-99', true, xmlDeclPToken));
   });

   it('sets version to 1.1 if that is what is passed in', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
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

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual(new XmlDeclarationXToken(1.1, undefined, undefined, xmlDeclPToken));
   });

   it('sets default parameters when input has none', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual(new XmlDeclarationXToken(1.0, 'utf-8', false, xmlDeclPToken));
   });

   it('sets default values when input values are erronious', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
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

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual(new XmlDeclarationXToken(1.0, 'some-encoding', false, xmlDeclPToken));
   });

   it('treats a mis-cased standalone as the correct case', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
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

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual(new XmlDeclarationXToken(1.0, 'some-encoding', true, xmlDeclPToken));
   });
});
