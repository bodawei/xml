/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { parseAttListDeclaration } from 'pToken';
import { DeclarationStart } from 'token';
import { describe, expect, it } from 'vitest';

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

   it('converts to the expected xtoken', () =>
      new Promise<void>((done) => {
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
            done();
         });
      }));

   it('includes an ENUMERATED type', () =>
      new Promise<void>((done) => {
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

            done();
         });
      }));

   it('includes an NOTATION type', () =>
      new Promise<void>((done) => {
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

            done();
         });
      }));
});
