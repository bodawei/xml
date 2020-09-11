/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   parseProcessingInstruction,
   ProcessingInstructionPToken,
 } from '../processingInstruction';

describe('processingInstruction (integration)', () => {
   let piPToken: ProcessingInstructionPToken;

   beforeEach(() => {
      const proto = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('targetName'),
      };
      piPToken = new ProcessingInstructionPToken(proto);
   });

   describe('parse()', () => {

      it('asks the instruction module to include a type in the PToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('blah blah?>');
         source.endText();

         parseProcessingInstruction(source, { open: SToken.fromString('') } as any, (parsing) => {
            expect(parsing.type).toEqual(PROCESSING_INSTRUCTION_PTOKEN);
            done();
         });
      });

   });

});
