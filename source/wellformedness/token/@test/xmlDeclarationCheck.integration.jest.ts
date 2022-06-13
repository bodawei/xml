/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { InstructionStart, parseXmlDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'basic';

import { WellFormedError } from '../../error/wellFormedError';
import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { xmlDeclarationCheck } from '../xmlDeclarationCheck';

const WFEID = wellFormedErrorCodes.id;

describe('xmlDeclarationCheck (integration)', () => {
   let start: InstructionStart;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      start = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      };
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   it('reports an error when the target text is malformed (check charCheck())', (done) => {
      source.addText('version "1.0" encoding="usascii"?>');
      start.target = toSToken('\u0001xml');

      parseXmlDeclaration(source, start, (result) => {
         const collector = new ProblemCollector(start.open, WellFormedError);

         xmlDeclarationCheck(result, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });

   it('reports an error when the param value is malformed (check charCheck())', (done) => {
      source.addText('version="\u00011.0" encoding="usascii"?>');

      parseXmlDeclaration(source, start, (result) => {
         const collector = new ProblemCollector(result.open, WellFormedError);

         xmlDeclarationCheck(result, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
