/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { defaultExtractors } from 'extractor';
import { ProcessingInstructionPToken, parseProcessingInstruction } from 'pToken';
import { SToken, STokenSource, toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';
import { processingInstructionCheck } from '../processingInstructionCheck';

describe('processingInstructionCheck() (integration)', () => {
   let piPToken: ProcessingInstructionPToken;

   beforeEach(() => {
      const proto = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('targetName'),
      };
      piPToken = new ProcessingInstructionPToken(proto);
   });

   it('asks the instruction module report if there is an extra space', (done) => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         openSpace: toSToken(' '),
      });
      const source = new STokenSource(defaultExtractors);
      source.addText('blah blah?>');
      source.endText();

      parseProcessingInstruction(source, piPToken, (pToken) => {
         const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

         processingInstructionCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
         done();
      });
   });
});
