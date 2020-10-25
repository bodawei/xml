/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { TextPToken, TextXToken, WordListPToken, WordListType } from 'token';

import { ATTLIST_DECLARATION_XTOKEN, AttListDeclarationXToken } from '../attListDeclarationXToken';

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

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         pToken: aldPToken,
      });
   });

   it('creates an XToken from a string and attribute definitions', () => {
      const xToken = new AttListDeclarationXToken('theName', [
         {
            name: 'att1',
            type: 'CDATA',
            defaultType: '',
            value: [],
         },
      ]);

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'theName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               defaultType: '',
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

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: '',
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

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: undefined,
               defaultType: '#REQUIRED',
               value: [],
            },
            {
               name: 'attr2',
               type: 'bogus',
               defaultType: '#FIXED',
               enumeration: undefined,
               value: [new TextXToken('x', new TextPToken({ text: toSToken('x') }))],
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
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      enumeration.toXToken = () => [];

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'CDATA',
               enumeration: [],
               defaultType: '#REQUIRED',
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
      enumeration.toXToken = () => [];

      const xToken = new AttListDeclarationXToken(testToken);

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: 'ENUMERATION',
               enumeration: [],
               defaultType: '#REQUIRED',
               value: [],
            },
         ],
         pToken: testToken,
      });
   });

   it('replaces a missing type and defaultType value with a space', () => {
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

      expect(xToken).toEqualRangeless({
         type: ATTLIST_DECLARATION_XTOKEN,
         elementName: 'elementName',
         attDefs: [
            {
               name: 'att1',
               type: '',
               enumeration: undefined,
               defaultType: '#REQUIRED',
               value: [],
            },
         ],
         pToken: testToken,
      });
   });
});
