/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from 'wellformedness';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';
import { parseLiteralValue } from 'token';

import { literalValueCheck } from '../literalValueCheck';

describe('literalValueCheck()', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
   });

   it('reports an error if the value has a bad character (charCheck())', (done) => {
      source.addText('b\u0000d"');
      source.endText();
      parseLiteralValue(source, ['"'], (pToken) => {
         const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

         literalValueCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });

   it('reports an error if an entity reference is malformed', (done) => {
      source.addText('good& bad;"');
      source.endText();
      parseLiteralValue(source, ['"', '&'], (pToken) => {
         const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

         literalValueCheck(pToken, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
         done();
      });
   });
});
