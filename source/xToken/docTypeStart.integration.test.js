/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityLocation } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';

describe('docTypeStart (integration)', () => {

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

   describe('makeToken()', () => {
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
      });

      it('populates the token with data from the parsed', () => {
         const parsed = {
            type: 'DOCTYPE_START',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('DOCTYPE'),
            postDeclTypeSpace: expectedLToken('\t'),
            name: expectedLToken('elemType'),
            postNameSpace: expectedLToken('  '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: expectedLToken('PUBLIC'),
               postIdTypeSpace: expectedLToken(' '),
               publicOpenQuote: expectedLToken('"'),
               publicValue: expectedLToken('pub.xml'),
               publicCloseQuote: expectedLToken('"'),
               postPublicSpace: expectedLToken('\t'),
               systemOpenQuote: expectedLToken('"'),
               systemValue: expectedLToken('sys.xml'),
               systemCloseQuote: expectedLToken('"'),
            },
            postExternalIdSpace: expectedLToken('\t'),
            startInternalSubset: expectedLToken('['),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('elemType');
         expect(token.externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
         expect(token.lTokens[0]).toEqual(parsed.open);
         expect(token.lTokens[6]).toEqual(parsed.externalId.idType);
      });

   });

});
