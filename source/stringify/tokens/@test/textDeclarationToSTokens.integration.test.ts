/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { parseTextDeclaration } from 'pToken';
import { STokenSource, SToken } from 'sToken';

import { InstructionStart } from '../../../token/bridge/instruction';

import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

describe('textDeclarationToSTokens() (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      start = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
      };
   });

   it('returns the STokens', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('version="1.0" encoding="ascii" ?>');
      source.endText();

      parseTextDeclaration(source, start, (parsing) => {
         const result = textDeclarationToSTokens(parsing);

         expect(result[0]).toEqual(SToken.fromString('<?'));
         done();
      });
   });
});
