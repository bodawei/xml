/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import {
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
} from 'pToken';

import { elementDeclarationValidate } from '../elementDeclarationValidate';

describe('elementDeclarationValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;

   beforeEach(() => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
   });

      it('can overide properties with the second parameter', () => {
         const newPToken = new ElementDeclarationPToken(elementDeclaration, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: undefined,
            declTypeSpace: undefined,
            name: toSToken('3'),
            nameSpace: undefined,
            contentSpec: toSToken('4'),
            contentSpecSpace: toSToken('5'),
            close: toSToken('>'),
         });

         expect(newPToken).toEqual(
            new ElementDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: undefined,
               declTypeSpace: undefined,
               name: toSToken('3'),
               nameSpace: undefined,
               contentSpec: toSToken('4'),
               contentSpecSpace: toSToken('5'),
               close: toSToken('>'),
            }),
         );
      });
});
