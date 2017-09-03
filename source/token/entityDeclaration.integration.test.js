/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, ErrorCollector } from '../basic';
import { WellFormedError, XmlWarning } from '../error';
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

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.BANGITEM_OPEN_XTRA_SPACE_AFTER);
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

      xit('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
         source.addText('entityName SYSTEM >');
         entityDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
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

});
