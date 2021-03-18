/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';
import { entityDeclarationCheck } from '../entityDeclarationCheck';

import { parseEntityDeclaration } from '../../../pToken/bridge/entityDeclaration';

// ick
import { DeclarationStart } from 'token';

describe('entityDeclarationCheck() (integration)', () => {
   let declarationStart: DeclarationStart;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken('\t'),
      };
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
   });

   it('reports errors in the literal value (literal.checkWellFormed())', (done) => {
      source.addText('entityName "entityValue'); // missing closing quote
      source.endText();
      parseEntityDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
         done();
      });
   });

   it('reports an error when name used an invalid char(check nameCheck())', (done) => {
      source.addText('$foo "frog">');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_NAME_INVALID);
         done();
      });
   });

   it('reports an error when name starts with "xml" (check misc.checkWellFormedNameRecommendation())', (done) => {
      source.addText('xmlFoo "frog">');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
         done();
      });
   });

   it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
      source.addText('entityName SYSTEM >');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_MISSING_SYSTEM_VALUE);
         done();
      });
   });

   it('reports an error when NDATA value has a bad char (check misc.checkCharWellFormed())', (done) => {
      source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
