/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { ElementDeclarationPToken } from '../../../pToken/token/elementDeclaration';
import { elementDeclarationToSTokens } from '../elementDeclarationToSTokens';

describe('elementDeclarationToSTokens() (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;

   it('returns all the STokens', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken('\r'),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentKeyword: toSToken('ANY'),
         contentKeywordSpace: toSToken('\n'),
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

   // it('returns all the STokens, including anything from the ContentSpecP', () => {
   //    elementDeclaration = new ElementDeclarationPToken({
   //       open: toSToken('<!'),
   //       openSpace: undefined,
   //       declType: toSToken('ELEMENT'),
   //       declTypeSpace: toSToken('\r'),
   //       name: toSToken('elementName'),
   //       nameSpace: toSToken(' '),
   //       contentSpec: new ContentSpecP({
   //          open: toSToken('('),
   //          repeat: toSToken('*'),
   //       }),
   //       extra: undefined,
   //       close: toSToken('>'),
   //    });

   //    expect(elementDeclarationToSTokens(elementDeclaration)).toEqual([
   //       toSToken('<!'),
   //       toSToken('ELEMENT'),
   //       toSToken('\r'),
   //       toSToken('elementName'),
   //       toSToken(' '),
   //       toSToken('('),
   //       toSToken('*'),
   //       toSToken('>'),
   //    ]);
   // });
});
