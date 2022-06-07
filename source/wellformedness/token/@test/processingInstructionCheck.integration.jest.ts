/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { ProcessingInstructionPToken, parseProcessingInstruction } from 'pToken';
import { STokenSource, toSToken } from 'sToken';

import { WellFormedError } from '../../error/wellFormedError';
import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { processingInstructionCheck } from '../processingInstructionCheck';

const WFEID = wellFormedErrorCodes.id;

describe('processingInstructionCheck() (integration)', () => {
   let piPToken: ProcessingInstructionPToken;

   beforeEach(() => {
      const proto = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('targetName'),
      };
      piPToken = new ProcessingInstructionPToken(proto);
   });

   it('asks the instruction module report if there is an extra space', (done) => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         openSpace: toSToken(' '),
      });
      const source = new STokenSource();
      source.addText('blah blah?>');
      source.endText();

      parseProcessingInstruction(source, piPToken, (pToken) => {
         const collector = new ProblemCollector(toSToken(''), WellFormedError);

         processingInstructionCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.PI_SPACE_AFTER_OPEN);
         done();
      });
   });
});
