/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { parseTextDeclaration } from 'pToken';
import { STokenSource, SToken } from 'sToken';

import { InstructionStart } from '../../../pToken/bridge/instruction';

import { textDeclarationCheck } from '../textDeclarationCheck';

describe('textDeclaration (integration)', () => {
   let start: InstructionStart;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      start = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
      };
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
   });

   it('reports an error when the target text is malformed (check misc.checkCharWellFormed())', (done) => {
      source.addText('version "1.0" encoding="usascii"?>');
      start.target = SToken.fromString('\u0001xml');

      parseTextDeclaration(source, start, (result) => {
         const ec = new ErrorCollector(start.open, WellFormedError);

         textDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done?.();
      });
   });

   it('reports an error when the param value is malformed (check misc.checkCharWellFormed())', (done) => {
      source.addText('version="\u00011.0" encoding="usascii"?>');

      parseTextDeclaration(source, start, (result) => {
         const ec = new ErrorCollector(start.open, WellFormedError);

         textDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done?.();
      });
   });
});
