/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { ProcessingInstructionPToken, parseProcessingInstruction } from 'pToken';
import { SToken, STokenSource } from 'sToken';

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
      (piPToken as any).openSpace = SToken.fromString(' '); // typeHack
      const source = new STokenSource(defaultExtractors);
      source.addText('blah blah?>');
      source.endText();

      parseProcessingInstruction(source, piPToken as any, (pToken) => {
         const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

         processingInstructionCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
         done();
      });
   });
});
