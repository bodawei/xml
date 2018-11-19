/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { EntityInstructionParam, parseEntityInstruction } from '../entityInstruction';
import { InstructionStart } from '../../bridge/instruction';

describe('entityInstruction (integration)', () => {

   describe('parseEntityInstruction()', () => {

      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseEntityInstruction(source, {} as InstructionStart, ['version', 'encoding'], (parsing) => {
            expect(parsing.params[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseEntityInstruction(source, {} as InstructionStart, ['version', 'encoding'], (parsing) => {
            expect(parsing.params[1].value!.str).toEqual('ascii');
            done();
         });
      });

   });

});
