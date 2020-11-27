/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from '../../../pToken/token/elementDeclaration';
import { toSToken } from 'sToken';

import { ELEMENT_DECLARATION_XTOKEN, ElementDeclarationXToken } from '../elementDeclarationXToken';

// ick
import { NameListPToken } from 'token';

describe('ElementDeclarationXToken', () => {
   it('returns an element declaration token built from a PToken', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentSpec: toSToken('ANY'),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpecType: 'ANY',
         children: undefined,
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token with blank values if none in the PToken', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: '',
         contentSpecType: '',
         children: undefined,
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token with children if there is a namelist', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         children: new NameListPToken({ open: toSToken('('), repeat: toSToken('*') }),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpecType: 'CHILDREN',
         children: {
            listType: 'CHOICE',
            names: [],
            repeat: 'ZEROPLUS',
         },
         pToken: elementDeclaration,
      });
   });

   it('returns a notation declaration when provided with specific parameters', () => {
      const result = new ElementDeclarationXToken('one', 'FOO', {
         listType: 'CHOICE',
         names: [],
         repeat: 'ZEROPLUS',
      });

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpecType: 'FOO',
         children: {
            listType: 'CHOICE',
            names: [],
            repeat: 'ZEROPLUS',
         },
      });
   });

   it('returns a notation declaration when called with minimal parameters', () => {
      const result = new ElementDeclarationXToken('one');

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpecType: '',
         children: undefined,
      });
   });
});
