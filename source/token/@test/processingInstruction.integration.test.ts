/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error/index';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { SToken } from '../../sToken/index';

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   parseProcessingInstruction,
   ProcessingInstructionPToken,
 } from '../processingInstruction.js';

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
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         parseProcessingInstruction(source, { open: SToken.fromString('') }, (parsing) => {
            expect(parsing.type).toEqual(PROCESSING_INSTRUCTION_PTOKEN);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the instruction module report if there is an extra space', (done) => {
         (piPToken as any).openSpace = SToken.fromString(' '); // typeHack
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         parseProcessingInstruction(source, piPToken, (pToken) => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            pToken.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

   });

});
