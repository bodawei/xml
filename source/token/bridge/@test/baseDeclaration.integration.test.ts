/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from '../../../extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import declaration, { DeclarationPToken } from '../baseDeclaration';

describe('declaration (integration)', () => {
   let declarationPToken: DeclarationPToken;

   beforeEach(() => {
      const sourceSToken = makeSTokenMaker();
      declarationPToken = new declaration.PToken(undefined, {
         postOpenSpace: sourceSToken(' '),
         declType: sourceSToken('DOCTYPE'),
         postDeclTypeSpace: sourceSToken(' '),
      });
      declarationPToken.open = sourceSToken('<!');
   });

   describe('parse()', () => {

      it('produces a full pToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText(' DOCTYPE ');
         source.endText();

         declaration.parse(source, declarationPToken.open, (pToken) => {
            expect(pToken).toEqual(declarationPToken);
            done();
         });
      });

   });

});
