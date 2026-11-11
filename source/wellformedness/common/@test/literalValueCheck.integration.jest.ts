/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { toSToken, STokenSource } from 'basic';
import { parseLiteralValue } from 'token';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { literalValueCheck } from '../literalValueCheck';

const WFEID = wellFormedErrorCodes.id;

describe('literalValueCheck()', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   it('reports an error if the value has a bad character (charCheck())', () =>
      new Promise<void>((done) => {
         source.addText('b\u0000d"');
         source.endText();
         parseLiteralValue(source, ['"'], (pToken) => {
            const collector = new ProblemCollector(toSToken(''), WellFormedError);

            literalValueCheck(pToken, collector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
            done();
         });
      }));

   it('reports an error if an entity reference is malformed', () =>
      new Promise<void>((done) => {
         source.addText('good& bad;"');
         source.endText();
         parseLiteralValue(source, ['"', '&'], (pToken) => {
            const collector = new ProblemCollector(toSToken(''), WellFormedError);

            literalValueCheck(pToken, collector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(WFEID.REFERENCE_XTRA_SPACE);
            done();
         });
      }));
});
