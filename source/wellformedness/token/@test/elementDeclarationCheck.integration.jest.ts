/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { parseElementDeclaration } from '../../../pToken/token/elementDeclaration';
import { STokenSource, toSToken } from 'sToken';

import { elementDeclarationCheck } from '../elementDeclarationCheck';

import { DeclarationStart } from 'token';

describe('elementDeclarationCheck()', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
      };
   });

   it('calls misc.checkName() to report on invalid names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('$foo ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (result) => {
         const ec = new ErrorCollector(result.open, WellFormedError);

         elementDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_NAME_INVALID);
         done();
      });
   });

   it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('xmlOne ANY>');
      source.endText();

      parseElementDeclaration(source, declarationStart, (parsing) => {
         const ec = new ErrorCollector(toSToken('x'), WellFormedError);

         elementDeclarationCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED);
         done();
      });
   });
});
