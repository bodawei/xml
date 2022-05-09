/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, ErrorCollector } from 'basic';
import { parseNotationDeclaration } from 'pToken';
import { SToken, STokenSource } from 'sToken';
import { DeclarationStart } from 'token';

import { WellFormedError } from '../../error/WellFormedError';
import { wellFormedWarningCodes } from '../../error/wellFormedWarningCodes';

import { notationDeclarationCheck } from '../notationDeclarationCheck';

describe('notationDeclarationCheck() (integration)', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: SToken.fromString('<!'),
         openSpace: undefined,
         declType: SToken.fromString('NOTATION'),
         declTypeSpace: SToken.fromString(' '),
      };
   });

   it('asks the externalId module to look for well formed problems', (done) => {
      const source = new STokenSource();
      source.addText('foo system "sys.dtd">');
      source.endText();

      parseNotationDeclaration(source, declarationStart, (parsing) => {
         const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

         notationDeclarationCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
         done?.();
      });
   });

   it('calls nameCheck() to report on invalid names', (done) => {
      const source = new STokenSource();
      source.addText('$foo system "sys.dtd">');
      source.endText();
      parseNotationDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(result.open, WellFormedError);

         notationDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
         done?.();
      });
   });

   it('calls nameXmlCheck() to report on bad names', (done) => {
      const source = new STokenSource();
      source.addText('xmlOne system "sys.dtd">');
      source.endText();

      parseNotationDeclaration(source, declarationStart, (parsing) => {
         const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

         notationDeclarationCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(
            wellFormedWarningCodes.id.NOTATIONDECL_NAME_XML_RESERVED,
         );
         done?.();
      });
   });
});
