/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { STokenSource } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import declaration, { DeclarationPToken } from '../baseDeclaration';

describe('baseDeclaration (integration)', () => {
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
         const source = new STokenSource();
         source.addText(' DOCTYPE ');
         source.endText();

         declaration.parse(source, declarationPToken.open, (pToken) => {
            expect(pToken).toEqual(declarationPToken);
            done();
         });
      });

   });

});
