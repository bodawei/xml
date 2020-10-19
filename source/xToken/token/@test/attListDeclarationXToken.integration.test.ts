/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { parseAttListDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'sToken';

import { DeclarationStart } from 'token';

import { AttListDeclarationXToken } from '../attListDeclarationXToken';

fdescribe('attListDeclarationXToken (integration)', () => {
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
      const source = new STokenSource(defaultExtractors);
      source.addText('foo>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         if (!pToken) {
            throw new Error('Unexpected undefined PToken.');
         }

         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual(
            jasmine.objectContaining({
               elementName: 'foo',
               attDefs: [],
            }),
         );
         done();
      });
   });

   it('includes an ENUMERATED type', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName attrName ( one | two ) #REQUIRED>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual(
            jasmine.objectContaining({
               elementName: 'elName',
               attDefs: [
                  {
                     name: 'attrName',
                     type: 'ENUMERATION',
                     enumeration: ['one', 'two'],
                     defaultType: '#REQUIRED',
                     value: [],
                  },
               ],
            }),
         );

         done();
      });
   });

   it('includes an NOTATION type', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName attrName NOTATION ( one | two ) #REQUIRED>');
      source.endText();

      parseAttListDeclaration(source, declarationStart, (pToken) => {
         const token = new AttListDeclarationXToken(pToken);

         expect(token).toEqual(
            jasmine.objectContaining({
               elementName: 'elName',
               attDefs: [
                  {
                     name: 'attrName',
                     type: 'NOTATION',
                     enumeration: ['one', 'two'],
                     defaultType: '#REQUIRED',
                     value: [],
                  },
               ],
            }),
         );

         done();
      });
   });
});
