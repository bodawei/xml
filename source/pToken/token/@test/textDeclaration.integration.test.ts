/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import { InstructionStart } from '../../bridge/instruction';
import { parseTextDeclaration } from '../textDeclaration';

describe('textDeclaration (integration)', () => {
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

         parseTextDeclaration(source, start, (parsing) => {
            expect(parsing.fields[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseTextDeclaration(source, start, (parsing) => {
            expect(parsing.fields[1].value!.str).toEqual('ascii');
            done();
         });
      });
   });
});
