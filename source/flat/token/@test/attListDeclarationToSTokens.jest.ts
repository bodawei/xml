/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { AttListDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { WordListPToken, WordListType } from 'token';
import { makeTextPToken } from 'token-test';

import { attListDeclarationToSTokens } from '../attListDeclarationToSTokens';

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
         toSToken('('), // wordlist
         attOne.defaultType,
         attOne.defaultTypeSpace,
         attOne.openQuote,
         textToken.text,
         attOne.closeQuote,
         attOne.valueSpace,
         gePToken.extra,
         gePToken.close,
      ]);
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
         textToken.text,
         gePToken.close,
      ]);
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
         extra: false,
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
      ]);
   });

   it('reports neither extra or unexpanded if neither present', () => {
      const gePToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
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
      ]);
   });
});
