/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, warning } from 'basic';
import { parseElementDeclaration } from 'pToken';
import { STokenSource, toSToken } from 'sToken';
import { DeclarationStart } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { elementDeclarationCheck } from '../elementDeclarationCheck';

describe('elementDeclarationCheck()', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
      };
   });

   it('calls checName() to report on invalid names', (done) => {
      const source = new STokenSource();
      source.addText('$foo ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(result.open, WellFormedError);

         elementDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_NAME_INVALID);
         done();
      });
   });

   it('calls nameXmlCheck() to report on bad names', (done) => {
      const source = new STokenSource();
      source.addText('xmlOne ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (parsing) => {
         const ec = new ErrorCollector(toSToken('x'), WellFormedError);

         elementDeclarationCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(warning.id.ELEMENTDECL_NAME_XML_RESERVED);
         done();
      });
   });
});
