/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as entityDeclaration from './entityDeclaration.js';

describe('entityDeclaration', () => {

   describe('checkWellFormed()', () => {
      let parsed;
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         parsed = {
            open: expectedLToken('<!'),
            declType: expectedLToken('ENTITY'),
            postDeclTypeSpace: expectedLToken('\t'),
         };
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports errors in the declaration part (declaration.checkWellFormed())', (done) => {
         parsed.postOpenSpace = expectedLToken(' ');
         source.addText('entityName "entityValue">');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('reports errors in the literal value (quotedValue.checkWellFormed())', (done) => {
         source.addText('entityName "entityValue');  // missing closing quote
         source.endText();
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.QUOTEDVALUE_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('reports an error when name used an invalid char(check misc.checkName())', (done) => {
         source.addText('$foo "frog">');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_NAME_INVALID);
            done();
         });
      });

      it('reports an error when name starts with "xml" (check misc.checkWellFormedNameRecommendation())', (done) => {
         source.addText('xmlFoo "frog">');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
         source.addText('entityName SYSTEM >');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.QUOTEDVALUE_NO_OPEN_QUOTE);
            done();
         });
      });

      it('reports an error when NDATA value has a bad char (check misc.checkWellFormedText())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

   describe('makeToken()', () => {
      let parsed;
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         parsed = {
            open: expectedLToken('<!'),
            declType: expectedLToken('ENTITY'),
            postDeclTypeSpace: expectedLToken('\t'),
         };
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('creates a token with the externalLoc set', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, parsed, (parsed) => {
            const token = entityDeclaration.makeToken(parsed);

            expect(token.externalLoc).toEqual(new EntityLocation('sys.xml'));
            done();
         });
      });

      it('adds the token to the lToken list', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, parsed, (parsed) => {
            const token = entityDeclaration.makeToken(parsed);

            expect(token.lTokens[8].text).toEqual('sys.xml');
            done();
         });
      });

   });

});
