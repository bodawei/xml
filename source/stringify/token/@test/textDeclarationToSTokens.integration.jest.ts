/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { InstructionStart, parseTextDeclaration } from 'pToken';
import { STokenSource, SToken, toSToken } from 'sToken';

import { textDeclarationToSTokens } from '../textDeclarationToSTokens';

describe('textDeclarationToSTokens() (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      start = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      };
   });

   it('returns the STokens', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('version="1.0" encoding="ascii" ?>');
      source.endText();

      parseTextDeclaration(source, start, (parsing) => {
         const result = textDeclarationToSTokens(parsing);

         expect(result[0]).toEqual(toSToken('<?'));
         done();
      });
   });
});
