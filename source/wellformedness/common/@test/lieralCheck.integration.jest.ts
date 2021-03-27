/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { SToken, STokenSource } from 'sToken';
import { parseLiteral, LiteralPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { literalCheck } from '../literalCheck';

describe('literalCheck() (integration)', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   it('reports an error if the value has a bad character (charCheck())', (done) => {
      const pToken: LiteralPToken = { value: [] };
      source.addText('"b\u0000d"');
      source.endText();
      parseLiteral(
         source,
         {
            pToken: pToken,
         },
         () => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalCheck(pToken, ec, new ConformanceVersion(), 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         },
      );
   });

   it('reports an error if an entity reference is malformed', (done) => {
      const pToken: LiteralPToken = { value: [] };
      source.addText('"good& bad;"');
      source.endText();
      parseLiteral(
         source,
         {
            pToken: pToken,
            geRef: true,
         },
         () => {
            const ec = new ErrorCollector(SToken.fromString(''), WellFormedError);

            literalCheck(pToken, ec, new ConformanceVersion(), 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
            done();
         },
      );
   });
});
