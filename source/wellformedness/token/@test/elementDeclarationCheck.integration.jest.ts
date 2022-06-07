/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { parseElementDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'sToken';
import { DeclarationStart } from 'token';

import { wellFormedErrorCodes, WellFormedError } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';

import { elementDeclarationCheck } from '../elementDeclarationCheck';

const WFEID = wellFormedErrorCodes.id;

describe('elementDeclarationCheck()', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         open: toSToken('<!'),
      };
   });

   it('calls checName() to report on invalid names', (done) => {
      const source = new STokenSource();
      source.addText('$foo ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(result.open, WellFormedError);

         elementDeclarationCheck(result, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(WFEID.ELEMENTDECL_NAME_INVALID);
         done();
      });
   });

   it('calls nameXmlCheck() to report on bad names', (done) => {
      const source = new STokenSource();
      source.addText('xmlOne ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (parsing) => {
         const collector = new ProblemCollector(toSToken('x'), WellFormedError);

         elementDeclarationCheck(parsing, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(
            warningCodes.id.ELEMENTDECL_NAME_XML_RESERVED,
         );
         done();
      });
   });
});
