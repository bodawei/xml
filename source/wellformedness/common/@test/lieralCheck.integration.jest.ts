/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { SToken, STokenSource } from 'sToken';
import { parseLiteral, LiteralPToken } from 'token';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';

import { literalCheck } from '../literalCheck';

const WFEID = wellFormedErrorCodes.id;

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
            const ec = new ProblemCollector(SToken.fromString(''), WellFormedError);

            literalCheck(pToken, ec, new ConformanceVersion(), 'aType');

            // @ts-expect-error 2329/matchers
            expect(ec).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
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
            geRef: true,
            pToken: pToken,
         },
         () => {
            const ec = new ProblemCollector(SToken.fromString(''), WellFormedError);

            literalCheck(pToken, ec, new ConformanceVersion(), 'aType');

            // @ts-expect-error 2329/matchers
            expect(ec).toHaveProblem(WFEID.REFERENCE_XTRA_SPACE);
            done();
         },
      );
   });
});
