/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector } from 'basic';
import { STokenSource, toSToken } from 'sToken';
import { parseComment } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { commentCheck } from '../commentCheck';

describe('commentCheck() (integration)', () => {
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
   });

   it('reports on invalid characters in the comment', (done) => {
      const source = new STokenSource();
      source.addText('x\u0000y-->');
      source.endText();

      parseComment(source, toSToken('<!--'), (parsing) => {
         const ec = new ErrorCollector(toSToken('x'), WellFormedError);

         commentCheck(parsing, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done?.();
      });
   });
});
