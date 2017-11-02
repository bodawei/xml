/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';

describe('declaration (integration)', () => {
   let declarationPToken;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      declarationPToken = {
         type: declaration.TYPE,
         postOpenSpace: sourceLToken(' '),
         declType: sourceLToken('DOCTYPE'),
         postDeclTypeSpace: sourceLToken(' '),
      };
      declarationPToken.open = sourceLToken('<!');
   });

   describe('parse()', () => {

      it('produces a full pToken', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' DOCTYPE ');
         source.endText();

         declaration.parse(source, declarationPToken.open, (parsing) => {
            expect(parsing).toEqual(declarationPToken);
            done();
         });
      });

   });

});
