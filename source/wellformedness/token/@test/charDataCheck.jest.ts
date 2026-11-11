/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { CharDataPToken } from 'token';
import { describe, expect, it, vi } from 'vitest';

import { charCheck } from '../../common/charCheck';
import { charDataCheck } from '../charDataCheck';

vi.mock('../../common/charCheck');

describe('commentCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let charDataPToken: CharDataPToken;

   beforeEach(() => {
      charDataPToken = new CharDataPToken({
         text: toSToken('blah'),
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the charCheck to verify the text is well formed', () => {
      charDataCheck(charDataPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(charDataPToken.text, collector, confVer, false);
   });
});
