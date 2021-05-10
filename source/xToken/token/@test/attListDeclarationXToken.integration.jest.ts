/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { parseAttListDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'sToken';

import { DeclarationStart } from 'token';

import { AttListDeclarationXToken, ATTLIST_DECLARATION_XTOKEN } from '../attListDeclarationXToken';

describe('attListDeclarationXToken (integration)', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ATTLIST'),
         declTypeSpace: toSToken(' '),
      };
   });

   it('converts to the expected xtoken', (done) => {
      const source = new STokenSource();
      source.addText('foo>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual({
            type: ATTLIST_DECLARATION_XTOKEN,
            elementName: 'foo',
            attDefs: [],
            pToken,
         });
         done?.();
      });
   });

   it('includes an ENUMERATED type', (done) => {
      const source = new STokenSource();
      source.addText('elName attrName ( one |  | two ) #REQUIRED>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual({
            type: ATTLIST_DECLARATION_XTOKEN,
            elementName: 'elName',
            attDefs: [
               {
                  name: 'attrName',
                  type: 'ENUMERATION',
                  enumeration: ['one', 'two'],
                  defaultType: 'REQUIRED',
                  value: [],
               },
            ],
            pToken,
         });

         done?.();
      });
   });

   it('includes an NOTATION type', (done) => {
      const source = new STokenSource();
      source.addText('elName attrName NOTATION ( one | two ) #REQUIRED>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual({
            type: ATTLIST_DECLARATION_XTOKEN,
            elementName: 'elName',
            attDefs: [
               {
                  name: 'attrName',
                  type: 'NOTATION',
                  enumeration: ['one', 'two'],
                  defaultType: 'REQUIRED',
                  value: [],
               },
            ],
            pToken,
         });

         done?.();
      });
   });
});
