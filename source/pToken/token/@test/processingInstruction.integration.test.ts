/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   parseProcessingInstruction,
} from '../processingInstruction';

describe('processingInstruction (integration)', () => {
   beforeEach(() => {});

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
