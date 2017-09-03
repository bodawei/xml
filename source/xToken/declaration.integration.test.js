/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';

describe('declaration (integration)', () => {

   describe('parse()', () => {
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('processes a document type start', (done) => {
         const sourceLToken = makeLTokenMaker();
         const openLToken = sourceLToken('<!');
         source.addText('DOCTYPE foo>');

         declaration.parse(source, openLToken, (result) => {
            expect(result).toContainParsedProps({
               type: docTypeStart.TYPE,
               open: openLToken,
               declType: expectedLToken('DOCTYPE'),
               postDeclTypeSpace: expectedLToken(' '),
               name: expectedLToken('foo'),
            });
            done();
         });
      });

      it('processes an entity start', (done) => {
         const sourceLToken = makeLTokenMaker();
         const openLToken = sourceLToken('<!');
         source.addText('ENTITY bar "foo">');

         declaration.parse(source, openLToken, (result) => {
            expect(result).toContainParsedProps({
               type: entityDeclaration.TYPE,
               open: openLToken,
               declType: expectedLToken('ENTITY'),
               postDeclTypeSpace: expectedLToken(' '),
               name: expectedLToken('bar'),
            });
            done();
         });
      });

   });

});
