/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ContentModelP, ElementDeclarationPToken } from 'pToken';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { contentModelToSTokens } from '../../common/contentModelToSTokens';
import { unexpandedToSTokens } from '../../common/unexpandedToSTokens';
import { elementDeclarationToSTokens } from '../elementDeclarationToSTokens';

vi.mock('../../common/contentModelToSTokens');
vi.mock('../../common/unexpandedToSTokens');

describe('elementDeclarationToSTokens() (unit)', () => {
   beforeEach(() => {
      (contentModelToSTokens as Mock).mockReturnValue([
         toSToken('content model'),
         toSToken('content B'),
      ]);
      (unexpandedToSTokens as Mock).mockReturnValue([
         toSToken('unexpanded1'),
         toSToken('unexpanded2'),
      ]);
   });

   it('returns all the STokens', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken('\r'),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentSpec: toSToken('ANY'),
         contentSpecSpace: toSToken('\n'),
         extra: toSToken('blah'),
         close: toSToken('>'),
      });

      expect(elementDeclarationToSTokens(elementDeclaration)).toEqual([
         toSToken('<!'),
         toSToken('\t'),
         toSToken('ELEMENT'),
         toSToken('\r'),
         toSToken('elementName'),
         toSToken(' '),
         toSToken('ANY'),
         toSToken('\n'),
         toSToken('blah'),
         toSToken('>'),
      ]);
   });

   it('returns all the STokens, including anything from the ContentModelP', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken('\r'),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentModel: new ContentModelP({
            open: toSToken('('),
            repeat: toSToken('*'),
         }),
         extra: false,
         close: toSToken('>'),
      });

      expect(elementDeclarationToSTokens(elementDeclaration)).toEqual([
         toSToken('<!'),
         toSToken('ELEMENT'),
         toSToken('\r'),
         toSToken('elementName'),
         toSToken(' '),
         toSToken('content model'),
         toSToken('content B'),
         toSToken('>'),
      ]);
   });

   it('returns all the STokens, including from an unexpanded section', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken('\r'),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         unexpanded: {
            tokens: [],
            propName: 'foo',
         },
         close: toSToken('>'),
      });

      expect(elementDeclarationToSTokens(elementDeclaration)).toEqual([
         toSToken('<!'),
         toSToken('ELEMENT'),
         toSToken('\r'),
         toSToken('elementName'),
         toSToken(' '),
         toSToken('unexpanded1'),
         toSToken('unexpanded2'),
         toSToken('>'),
      ]);
   });
});
