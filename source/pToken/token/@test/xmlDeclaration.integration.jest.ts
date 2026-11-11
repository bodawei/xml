/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { STokenSource, toSToken } from 'basic';

import { InstructionStart } from '../../bridge/instruction';
import { parseXmlDeclaration } from '../xmlDeclaration';

describe('xmlDeclaration (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      start = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      };
   });

   describe('parseXmlDeclaration()', () => {
      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource();
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.fields[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource();
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.fields[1].value!.str).toEqual('ascii');
            done();
         });
      });
   });
});
