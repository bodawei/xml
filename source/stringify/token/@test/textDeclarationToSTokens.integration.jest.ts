/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { InstructionStart, parseTextDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'sToken';

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
      const source = new STokenSource();
      source.addText('version="1.0" encoding="ascii" ?>');
      source.endText();

      parseTextDeclaration(source, start, (parsing) => {
         const result = textDeclarationToSTokens(parsing);

         expect(result[0]).toEqual(toSToken('<?'));
         done?.();
      });
   });
});
