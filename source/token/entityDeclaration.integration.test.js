/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
import { makeSTokenMaker } from '../sToken/test';

import * as entityDeclaration from './entityDeclaration.js';

describe('entityDeclaration (integration)', () => {
   let declarationPToken;
   let emd;
   let source;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      declarationPToken = {
         open: makeSToken('<!'),
         declType: makeSToken('ENTITY'),
         postDeclTypeSpace: makeSToken('\t'),
      };
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {

      it('parses an enty declaration with a PEReference', (done) => {
         const makeSToken = makeSTokenMaker();
         source.addText('aName "frog%foo;">');
         source.endText();

         entityDeclaration.parse(source, makeSToken('<'), (pToken) => {
            expect(pToken.type).toEqual(entityDeclaration.PTYPE);
            expect(pToken.value[1].type).toEqual('PARAMETERENTITYREF');
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

   describe('pTokenToXToken()', () => {

      it('adds the EntityValue (literal.makeTokenCompatible())', (done) => {
         source.addText('entityName "one" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.value[0].text.text).toEqual('one');
            done();
         });
      });

      it('creates a token with the externalLoc set (externalId.makeEntityLocation())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.externalLoc).toEqual(new EntityLocation('sys.xml'));
            done();
         });
      });

      it('adds the token to the SToken list (externalId.getStokens())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.pToken.externalId.system.value[0].text.text).toEqual('sys.xml');
            done();
         });
      });

      it('adds the token to the SToken list (literal.getSTokens())', (done) => {
         source.addText('entityName "dukkha" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.pToken.value[0].text.text).toEqual('dukkha');
            done();
         });
      });

   });

});
