/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as entityDeclaration from './entityDeclaration.js';

describe('entityDeclaration', () => {
   let declarationPToken;
   let emd;
   let source;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      declarationPToken = {
         open: expectedLToken('<!'),
         declType: expectedLToken('ENTITY'),
         postDeclTypeSpace: expectedLToken('\t'),
      };
      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {

      it('parses an enty declaration with a PEReference', (done) => {
         const expectedLToken = makeLTokenMaker();
         source.addText('aName "frog%foo;">');
         source.endText();

         entityDeclaration.parse(source, expectedLToken('<'), (pToken) => {
            expect(pToken.type).toEqual(entityDeclaration.TYPE);
            expect(pToken.literalValue[1].type).toEqual('PARAMETERENTITYREF');
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports errors in the declaration part (declaration.checkWellFormed())', (done) => {
         declarationPToken.postOpenSpace = declarationPToken.postDeclTypeSpace;
         source.addText('entityName "entityValue">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('reports errors in the literal value (literal.checkWellFormed())', (done) => {
         source.addText('entityName "entityValue');  // missing closing quote
         source.endText();
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('reports an error when name used an invalid char(check misc.checkName())', (done) => {
         source.addText('$foo "frog">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_NAME_INVALID);
            done();
         });
      });

      it('reports an error when name starts with "xml" (check misc.checkWellFormedNameRecommendation())', (done) => {
         source.addText('xmlFoo "frog">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
         source.addText('entityName SYSTEM >');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_OPEN_QUOTE);
            done();
         });
      });

      it('reports an error when NDATA value has a bad char (check misc.checkWellFormedText())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

   describe('makeToken()', () => {

      it('adds the EntityValue (literal.makeTokenCompatible())', (done) => {
         source.addText('entityName "one" >');
         entityDeclaration.parse(source, declarationPToken, (parsed) => {
            const xToken = entityDeclaration.makeToken(parsed);

            expect(xToken.value[0].text).toEqual('one');
            done();
         });
      });

      it('creates a token with the externalLoc set (externalId.makeTokenCompatible())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (parsed) => {
            const xToken = entityDeclaration.makeToken(parsed);

            expect(xToken.externalLoc).toEqual(new EntityLocation('sys.xml'));
            done();
         });
      });

      it('adds the token to the lToken list (externalId.appendLTokens())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (parsed) => {
            const xToken = entityDeclaration.makeToken(parsed);

            expect(xToken.lTokens[8].text).toEqual('sys.xml');
            done();
         });
      });

      it('adds the token to the lToken list (literal.appendLTokens())', (done) => {
         source.addText('entityName "dukkha" >');
         entityDeclaration.parse(source, declarationPToken, (parsed) => {
            const xToken = entityDeclaration.makeToken(parsed);

            expect(xToken.lTokens[6].text).toEqual('dukkha');
            done();
         });
      });

   });

});
