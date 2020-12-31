/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'sToken';
import { AttListDeclarationPToken } from 'pToken';

import { attListDeclarationToSTokens } from '../attListDeclarationToSTokens';
import { makeTextPToken } from 'token-test';
import { WordListPToken, WordListType } from 'token';

describe('attListDeclarationToSTokens()', () => {
   it('returns all the STokens', () => {
      const textToken = makeTextPToken('foo');
      const attOne = {
         name: toSToken('name'),
         nameSpace: toSToken(' '),
         type: toSToken('CDATA'),
         typeSpace: toSToken(' '),
         defaultType: toSToken('#REQUIRED'),
         defaultTypeSpace: toSToken(' '),
         enumeration: new WordListPToken(WordListType.ENUMERATION, {
            open: toSToken('('),
         }),
         openQuote: toSToken('"'),
         value: [textToken],
         closeQuote: toSToken('"'),
         valueSpace: toSToken(' '),
      };
      const gePToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         elementName: toSToken('elementName'),
         attDefs: [attOne],
         elementNameSpace: toSToken(' '),
         unexpanded: {
            propName: 'foo',
            tokens: [textToken],
         },
         extra: toSToken('extra'),
         close: toSToken('>'),
      });

      expect(attListDeclarationToSTokens(gePToken)).toEqual([
         gePToken.open,
         gePToken.openSpace,
         gePToken.declType,
         gePToken.declTypeSpace,
         gePToken.elementName,
         gePToken.elementNameSpace,
         attOne.name,
         attOne.nameSpace,
         attOne.type,
         attOne.typeSpace,
         attOne.defaultType,
         attOne.defaultTypeSpace,
         toSToken('('), // wordlist
         attOne.openQuote,
         textToken.text,
         attOne.closeQuote,
         attOne.valueSpace,
         gePToken.extra,
         gePToken.close,
      ] as Array<SToken>);
   });

   it('deals with a mostly empty attribute', () => {
      const textToken = makeTextPToken('foo');
      const attOne = {
         name: toSToken('name'),
         value: [],
      };
      const gePToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         elementName: toSToken('elementName'),
         attDefs: [attOne],
         elementNameSpace: toSToken(' '),
         unexpanded: {
            propName: 'foo',
            tokens: [textToken],
         },
         close: toSToken('>'),
      });

      expect(attListDeclarationToSTokens(gePToken)).toEqual([
         gePToken.open,
         gePToken.openSpace,
         gePToken.declType,
         gePToken.declTypeSpace,
         gePToken.elementName,
         gePToken.elementNameSpace,
         attOne.name,
         gePToken.close,
      ] as Array<SToken>);
   });

   it('copes when some properties missing in the ATTLIST itself', () => {
      const textToken = makeTextPToken('foo');
      const gePToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
         unexpanded: {
            propName: 'foo',
            tokens: [textToken],
         },
         close: toSToken('>'),
      });

      expect(attListDeclarationToSTokens(gePToken)).toEqual([
         gePToken.open,
         gePToken.openSpace,
         gePToken.declType,
         gePToken.declTypeSpace,
         gePToken.elementName,
         gePToken.elementNameSpace,
         gePToken.close,
      ] as Array<SToken>);
   });
});
