/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { AttListDeclarationPToken, TextPToken } from 'pToken';
import { WordListPToken, WordListType } from 'token';
import { describe, expect, it } from 'vitest';

import {
   ATTLIST_DECLARATION_XTOKEN,
   AttListDeclarationXToken,
   AttDefaultType,
   AttDefinitionType,
} from '../attListDeclarationXToken';
import { TextXToken } from '../textXToken';

describe('attListDeclarationXToken', () => {
   let aldPToken: AttListDeclarationPToken;

   beforeEach(() => {
      aldPToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ATTLIST'),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
         attDefs: [],
         close: toSToken('>'),
      });
   });

   it('creates an XToken from a PToken', () => {
      const xToken = new AttListDeclarationXToken(aldPToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [],
         pToken: aldPToken,
      });
   });

   it('creates an XToken from a string and attribute definitions', () => {
      const xToken = new AttListDeclarationXToken('theName', [
         {
            name: 'att1',
            type: AttDefinitionType.CDATA,
            defaultType: AttDefaultType.FIXED,
            enumeration: undefined,
            value: [],
         },
         {
            name: 'att2',
            type: AttDefinitionType.CDATA,
            defaultType: AttDefaultType.FIXED,
            enumeration: ['foo', 'bar'],
            value: [],
         },
      ]);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'theName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               defaultType: AttDefaultType.FIXED,
               value: [],
            },
            {
               name: 'att2',
               type: AttDefinitionType.CDATA,
               defaultType: AttDefaultType.FIXED,
               enumeration: ['foo', 'bar'],
               value: [],
            },
         ],
      });
   });

   it('creates an XToken with a blank name when pToken has no name', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementName: undefined,
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: '',
         attDefs: [],
         pToken: testToken,
      });
   });

   it('creates an XToken with the provided attributes', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
            {
               name: toSToken('attr2'),
               type: toSToken('bogus'),
               defaultType: toSToken('#FIXED'),
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('x') })],
               closeQuote: toSToken('"'),
            },
         ],
      });
      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: undefined,
               defaultType: 'REQUIRED',
               value: [],
            },
            {
               name: 'attr2',
               type: 'CDATA',
               defaultType: 'FIXED',
               enumeration: undefined,
               value: [new TextXToken(new TextPToken({ text: toSToken('x') }))],
            },
         ],
         pToken: testToken,
      });
   });

   it('hands off to nameList if there is an enumerated value', () => {
      const enumeration = new WordListPToken(WordListType.NOTATION, { open: toSToken('(') });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#IMPLIED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: [],
               defaultType: 'IMPLIED',
               value: [],
            },
         ],
         pToken: testToken,
      });
   });

   it('adds an ENUMERATION type value if there is no type already specified', () => {
      const enumeration = new WordListPToken(WordListType.NOTATION, { open: toSToken('(') });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'ENUMERATION',
               enumeration: [],
               defaultType: 'REQUIRED',
               value: [],
            },
         ],
         pToken: testToken,
      });
   });

   it('replaces a missing type with a default value', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: undefined,
               defaultType: 'REQUIRED',
               value: [],
            },
         ],
         pToken: testToken,
      });
   });

   it('replaces a flawed defaultType with a default value', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               defaultType: toSToken('#BOGUS'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
         ],
         pToken: testToken,
      });
   });

   it('converts all types', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('1'),
               type: toSToken('ID'),
               value: [],
            },
            {
               name: toSToken('2'),
               type: toSToken('IDREF'),
               value: [],
            },
            {
               name: toSToken('3'),
               type: toSToken('IDREFS'),
               value: [],
            },
            {
               name: toSToken('4'),
               type: toSToken('ENTITY'),
               value: [],
            },
            {
               name: toSToken('5'),
               type: toSToken('ENTITIES'),
               value: [],
            },
            {
               name: toSToken('6'),
               type: toSToken('NMTOKEN'),
               value: [],
            },
            {
               name: toSToken('7'),
               type: toSToken('NMTOKENS'),
               value: [],
            },
            {
               name: toSToken('8'),
               type: toSToken('NOTATION'),
               value: [],
            },
            {
               name: toSToken('9'),
               type: toSToken('CDATA'),
               value: [],
            },
         ],
      });

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqual({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: '1',
               type: 'ID',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '2',
               type: 'IDREF',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '3',
               type: 'IDREFS',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '4',
               type: 'ENTITY',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '5',
               type: 'ENTITIES',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '6',
               type: 'NMTOKEN',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '7',
               type: 'NMTOKENS',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '8',
               type: 'NOTATION',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
            {
               name: '9',
               type: 'CDATA',
               enumeration: undefined,
               defaultType: undefined,
               value: [],
            },
         ],
         pToken: testToken,
      });
   });
});
