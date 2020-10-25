/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import { parseXmlDeclaration } from '../xmlDeclaration';
import { InstructionStart } from '../../bridge/instruction';

describe('xmlDeclaration (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      start = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
      };
   });

   describe('parseXmlDeclaration()', () => {
      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.fields[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.fields[1].value!.str).toEqual('ascii');
            done();
         });
      });
   });
});
