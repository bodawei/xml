/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as processingInstruction from '../processingInstruction.js';

describe('processingInstruction (integration)', () => {
   let piPToken;
   let makeSToken;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      piPToken = {
         type: 'PROCESSING_INSTRUCTION',
         open: makeSToken('<?'),
         postOpenSpace: undefined,
         target: makeSToken('targetName'),
      };
   });

   describe('parse()', () => {

      it('asks the instruction module to include a type in the PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         processingInstruction.parse(source, {}, (parsing) => {
            expect(parsing.type).toEqual(processingInstruction.PTYPE);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the instruction module report if there is an extra space', (done) => {
         piPToken.postOpenSpace = makeSToken(' ');
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         processingInstruction.parse(source, piPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            processingInstruction.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

   });

});
