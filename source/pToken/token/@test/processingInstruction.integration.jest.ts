/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   parseProcessingInstruction,
} from '../processingInstruction';

describe('ProcessingInstructionPToken (integration)', () => {
   describe('parseProcessingInstruction()', () => {
      it('asks the instruction module to include a type in the PToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('blah blahx?>');
         source.endText();

         parseProcessingInstruction(source, { open: toSToken('<?') }, (parsing) => {
            expect(parsing).toEqualRangeless({
               type: PROCESSING_INSTRUCTION_PTOKEN,
               open: toSToken('<?'),
               instruction: toSToken('blah blahx'),
               close: toSToken('?>'),
            });
            done();
         });
      });
   });
});
