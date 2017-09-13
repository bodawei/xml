/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as processingInstruction from './processingInstruction.js';

describe('processingInstruction (integration)', () => {
   let defaultParsed;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: 'PROCESSING_INSTRUCTION',
         open: expectedLToken('<?'),
         postOpenSpace: undefined,
         target: expectedLToken('targetName'),
      };
   });

   describe('parse()', () => {

      it('asks the instruction module to include a type in the parsed results', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         processingInstruction.parse(source, {}, (parsing) => {
            expect(parsing.type).toEqual(processingInstruction.TYPE);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the instruction module report if there is an extra space', (done) => {
         defaultParsed.postOpenSpace = expectedLToken(' ');
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah blah?>');
         source.endText();

         processingInstruction.parse(source, defaultParsed, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            processingInstruction.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

   });

   describe('makeToken()', () => {

      it('includes the LTokens from an instruction', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('blah ?>');
         source.endText();

         processingInstruction.parse(source, defaultParsed, (parsing) => {
            const token = processingInstruction.makeToken(parsing);

            expect(token.lTokens[0]).toEqual(defaultParsed.open);
            done();
         });
      });

   });

});
