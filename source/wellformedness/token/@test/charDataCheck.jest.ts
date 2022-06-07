/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { CharDataPToken } from 'token';

import { charCheck } from '../../common/charCheck';

import { charDataCheck } from '../charDataCheck';

jest.mock('../../common/charCheck');

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
