/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { ContentDetails, ElDeclType, ValidityState } from '../../common/validityState';
import { elementDeclarationUpdateState } from '../elementDeclarationUpdateState';

describe('elementDeclarationUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let state: ValidityState;

   beforeEach(() => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      state = new ValidityState();
   });

   it('adds a declaration with a content spec or model', () => {
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
      );

      expect(result).toEqual(
         new ValidityState({
            elements: {
               elementName: {
                  isExternalMarkupDeclaration: false,
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
            },
         }),
      );
   });

   it('does not override another entry already present for the same name', () => {
      const second = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('EMPTY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const details: ContentDetails = {
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.EMPTY,
      };

      const result1 = elementDeclarationUpdateState(elementDeclaration, details, state);
      const result2 = elementDeclarationUpdateState(second, details, result1);

      expect(result2).toEqual(
         new ValidityState({
            elements: {
               elementName: {
                  isExternalMarkupDeclaration: false,
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
            },
         }),
      );
   });
});
