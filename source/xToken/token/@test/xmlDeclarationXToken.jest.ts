/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { XmlDeclarationPToken } from 'pToken';
import { toSToken } from 'basic';

import { XmlDeclarationXToken, XMLDECL_XTOKEN } from '../xmlDeclarationXToken';

describe('XmlDeclarationXToken()', () => {
   it('can be constructed with literal values', () => {
      const result = new XmlDeclarationXToken(1.0, 'UTF-99', true);

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.0,
         encoding: 'UTF-99',
         standalone: true,
      });
   });

   it('sets all parameters using the input', () => {
      const xmlDeclPToken = new XmlDeclarationPToken({
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

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.0,
         encoding: 'UTF-99',
         standalone: true,
         pToken: xmlDeclPToken,
      });
   });

   it('sets version to 1.1 if that is what is passed in', () => {
      const xmlDeclPToken = new XmlDeclarationPToken({
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

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.1,
         encoding: 'utf-8',
         standalone: false,
         pToken: xmlDeclPToken,
      });
   });

   it('sets default parameters when input has none', () => {
      const xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      const result = new XmlDeclarationXToken(xmlDeclPToken);

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.0,
         encoding: 'utf-8',
         standalone: false,
         pToken: xmlDeclPToken,
      });
   });

   it('sets default values when input values are erronious', () => {
      const xmlDeclPToken = new XmlDeclarationPToken({
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

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.0,
         encoding: 'some-encoding',
         standalone: false,
         pToken: xmlDeclPToken,
      });
   });

   it('treats a mis-cased standalone as the correct case', () => {
      const xmlDeclPToken = new XmlDeclarationPToken({
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

      expect(result).toEqual({
         type: XMLDECL_XTOKEN,
         version: 1.0,
         encoding: 'some-encoding',
         standalone: true,
         pToken: xmlDeclPToken,
      });
   });
});
