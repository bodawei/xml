/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { parseTextDeclaration } from 'pToken';
import { describe, expect, it } from 'vitest';

import { InstructionStart } from '../../../pToken/bridge/instruction';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { WellFormedError } from '../../error/wellFormedError';
import { textDeclarationCheck } from '../textDeclarationCheck';

const WFEID = wellFormedErrorCodes.id;

describe('textDeclaration (integration)', () => {
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

   it('reports an error when the target text is malformed (check charCheck())', () =>
      new Promise<void>((done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         start.target = toSToken('\u0001xml');

         parseTextDeclaration(source, start, (result) => {
            const collector = new ProblemCollector(start.open, WellFormedError);

            textDeclarationCheck(result, collector, confVer);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
            done();
         });
      }));

   it('reports an error when the param value is malformed (check charCheck())', () =>
      new Promise<void>((done) => {
         source.addText('version="\u00011.0" encoding="usascii"?>');

         parseTextDeclaration(source, start, (result) => {
            const collector = new ProblemCollector(start.open, WellFormedError);

            textDeclarationCheck(result, collector, confVer);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
            done();
         });
      }));
});
