/* Copyright ® 2017-220 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { STokenSource, toSToken } from 'sToken';

import { parseFieldedInstruction } from '../fieldedInstruction';

describe('entityInstruction (integration)', () => {
   describe('parseFieldedInstruction()', () => {
      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource();
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseFieldedInstruction(
            source,
            { open: toSToken('<?') },
            ['version', 'encoding'],
            (parsing) => {
               expect(parsing.fields[0].name.str).toEqual('version');
               done?.();
            },
         );
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource();
         source.addText('fish="1.0" frog="ascii" ?>');
         source.endText();

         parseFieldedInstruction(source, { open: toSToken('<?') }, ['fish', 'frog'], (parsing) => {
            expect(parsing.fields[1].value!.str).toEqual('ascii');
            done?.();
         });
      });
   });
});
