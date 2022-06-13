/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { parseEntityDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'basic';
import { DeclarationStart } from 'token';

import { wellFormedErrorCodes, WellFormedError } from '../../error/wellFormedError';
import { entityDeclarationCheck } from '../entityDeclarationCheck';
import { warningCodes } from '../../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;

describe('entityDeclarationCheck() (integration)', () => {
   let declarationStart: DeclarationStart;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      declarationStart = {
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken('\t'),
         open: toSToken('<!'),
      };
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   it('reports errors in the literal value (literalCheck())', (done) => {
      source.addText('entityName "entityValue'); // missing closing quote
      source.endText();
      parseEntityDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.LITERAL_NO_CLOSE_QUOTE);
         done();
      });
   });

   it('reports an error when name used an invalid char(check nameCheck())', (done) => {
      source.addText('$foo "frog">');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.ENTITYDECL_NAME_INVALID);
         done();
      });
   });

   it('reports an error when name starts with "xml" (check nameXmlCheck())', (done) => {
      source.addText('xmlFoo "frog">');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(
            warningCodes.id.ENTITYDECL_NAME_XML_RESERVED,
         );
         done();
      });
   });

   it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
      source.addText('entityName SYSTEM >');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.EXTERNALID_MISSING_SYSTEM_VALUE);
         done();
      });
   });

   it('reports an error when NDATA value has a bad char (check charCheck())', (done) => {
      source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
      parseEntityDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(declarationStart.open, WellFormedError);

         entityDeclarationCheck(result, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
