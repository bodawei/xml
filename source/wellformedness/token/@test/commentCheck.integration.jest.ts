/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { parseComment } from 'token';
import { describe, expect, it } from 'vitest';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { commentCheck } from '../commentCheck';

const WFEID = wellFormedErrorCodes.id;

describe('commentCheck() (integration)', () => {
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
   });

   it('reports on invalid characters in the comment', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('x\u0000y-->');
         source.endText();

         parseComment(source, toSToken('<!--'), (parsing) => {
            const collector = new ProblemCollector(toSToken('x'), WellFormedError);

            commentCheck(parsing, collector, confVer);

            expect(collector.getProblems()[0].id).toEqual(WFEID.CHARDATA_INVALID_CHAR);
            done();
         });
      }));
});
