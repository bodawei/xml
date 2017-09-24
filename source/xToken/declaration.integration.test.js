/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';

describe('declaration (integration)', () => {
   let defaultParsed;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      defaultParsed = {
         type: declaration.TYPE,
         postOpenSpace: sourceLToken(' '),
         declType: sourceLToken('DOCTYPE'),
         postDeclTypeSpace: sourceLToken(' '),
      };
      defaultParsed.open = sourceLToken('<!');
   });

   describe('parse()', () => {

      it('produces a full parsed result', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' DOCTYPE ');
         source.endText();

         declaration.parse(source, defaultParsed.open, (parsing) => {
            expect(parsing).toEqual(defaultParsed);
            done();
         });
      });

   });

});
