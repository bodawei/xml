/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { CharDataPToken } from 'token';

import { charCheck } from '../../common/charCheck';

import { charDataCheck } from '../charDataCheck';

jest.mock('../../common/charCheck');

describe('commentCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let charDataPToken: CharDataPToken;

   beforeEach(() => {
      charDataPToken = new CharDataPToken({
         text: toSToken('blah'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
   });

   it('asks the checks the text is well formed', () => {
      charDataCheck(charDataPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(charDataPToken.text, mockErrorCollector, confVer);
   });
});
