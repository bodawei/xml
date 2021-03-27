/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector } from 'basic';
import { STokenSource } from 'sToken';
import { parseCharData } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { charDataCheck } from '../charDataCheck';

describe('charDataCheck()', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   it('reports an error a bad character is in the text', (done) => {
      source.addText('bad\u0000&');
      source.endText();

      parseCharData(source, [], (result) => {
         const ec = new ErrorCollector(result!.text, WellFormedError);

         charDataCheck(result!, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done?.();
      });
   });
});
