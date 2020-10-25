/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { parseXmlDeclaration } from 'pToken';
import { STokenSource, SToken } from 'sToken';

import { xmlDeclarationCheck } from '../xmlDeclarationCheck';
import { InstructionStart } from '../../../pToken/bridge/instruction';

describe('xmlDeclarationCheck (integration)', () => {
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

      parseXmlDeclaration(source, start, (result) => {
         const ec = new ErrorCollector(start.open, WellFormedError);

         xmlDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });

   it('reports an error when the param value is malformed (check misc.checkCharWellFormed())', (done) => {
      source.addText('version="\u00011.0" encoding="usascii"?>');

      parseXmlDeclaration(source, start, (result) => {
         const ec = new ErrorCollector(result.open, WellFormedError);

         xmlDeclarationCheck(result, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
