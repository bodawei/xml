/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource } from 'basic';
import { parseCharData } from 'token';
import { describe, expect, it } from 'vitest';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { charDataCheck } from '../charDataCheck';

const WFEID = wellFormedErrorCodes.id;

describe('charDataCheck()', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   it('reports an error a bad character is in the text', () =>
      new Promise<void>((done) => {
         source.addText('bad\u0000&');
         source.endText();

         parseCharData(source, [], (result) => {
            const ec = new ProblemCollector(result!.text, WellFormedError);

            charDataCheck(result!, ec, confVer);

            expect(ec.getProblems()[0].id).toEqual(WFEID.CHARDATA_INVALID_CHAR);
            done();
         });
      }));
});
