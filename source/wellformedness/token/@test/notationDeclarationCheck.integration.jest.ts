/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ProblemCollector } from 'basic';
import { toSToken, STokenSource } from 'basic';
import { parseNotationDeclaration } from 'pToken';
import { DeclarationStart } from 'token';

import { warningCodes } from '../../error/warningCodes';
import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { notationDeclarationCheck } from '../notationDeclarationCheck';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('notationDeclarationCheck() (integration)', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
      };
   });

   it('asks the externalId module to look for well formed problems', (done) => {
      const source = new STokenSource();
      source.addText('foo system "sys.dtd">');
      source.endText();

      parseNotationDeclaration(source, declarationStart, (parsing) => {
         const collector = new ProblemCollector(toSToken('dummy'), WellFormedError);

         notationDeclarationCheck(parsing, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.EXTERNALID_INVALID_CASE);
         done();
      });
   });

   it('calls nameCheck() to report on invalid names', (done) => {
      const source = new STokenSource();
      source.addText('$foo system "sys.dtd">');
      source.endText();
      parseNotationDeclaration(source, declarationStart, (result) => {
         const collector = new ProblemCollector(result.open, WellFormedError);

         notationDeclarationCheck(result, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.NOTATIONDECL_NAME_INVALID);
         done();
      });
   });

   it('calls nameXmlCheck() to report on bad names', (done) => {
      const source = new STokenSource();
      source.addText('xmlOne system "sys.dtd">');
      source.endText();

      parseNotationDeclaration(source, declarationStart, (parsing) => {
         const collector = new ProblemCollector(toSToken('dummy'), WellFormedError);

         notationDeclarationCheck(parsing, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WID.NOTATIONDECL_NAME_XML_RESERVED);
         done();
      });
   });
});
