/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { FieldedInstruction } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { fieldedInstructionToSTokens } from '../fieldedInstructionToSTokens';

describe('sTokensFromPToken()', () => {
   let fieldedInstr: FieldedInstruction;

   it('extracts all the STokens', () => {
      fieldedInstr = new FieldedInstruction({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: toSToken('1.2'),
               closeQuote: toSToken('"'),
               valueSpace: toSToken(' '),
            },
            {
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('some-encoding'),
            },
            {
               name: toSToken('standalone'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('YES'),
            },
         ],
         close: toSToken('?>'),
      });

      const result = fieldedInstructionToSTokens(fieldedInstr);

      expect(result).toEqual([
         fieldedInstr.open,
         fieldedInstr.openSpace,
         fieldedInstr.target,
         fieldedInstr.targetSpace,
         fieldedInstr.fields[0].name,
         fieldedInstr.fields[0].nameSpace,
         fieldedInstr.fields[0].equal,
         fieldedInstr.fields[0].equalSpace,
         fieldedInstr.fields[0].openQuote,
         fieldedInstr.fields[0].value,
         fieldedInstr.fields[0].closeQuote,
         fieldedInstr.fields[0].valueSpace,
         fieldedInstr.fields[1].name,
         fieldedInstr.fields[1].nameSpace,
         fieldedInstr.fields[1].equal,
         fieldedInstr.fields[1].equalSpace,
         fieldedInstr.fields[1].value,
         fieldedInstr.fields[2].name,
         fieldedInstr.fields[2].nameSpace,
         fieldedInstr.fields[2].equal,
         fieldedInstr.fields[2].equalSpace,
         fieldedInstr.fields[2].value,
         fieldedInstr.close,
      ] as Array<SToken>);
   });
});
