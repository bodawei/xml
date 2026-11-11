/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import {
   makeCharRef,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeTextPToken,
} from 'token-test';

import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../../token/charRefXToken';
import { ParameterEntityReferenceXToken } from '../../token/parameterEntityReferenceXToken';
import { TextXToken } from '../../token/textXToken';
import { makeEntityValueX } from '../entityValueX';

describe('entityValue (integration)', () => {
   it('converts intput PToken into a set of XTokens', () =>
      new Promise<void>((done) => {
         const result = makeEntityValueX([
            makeTextPToken('foo'),
            makeCharRef(),
            makeParameterEntityReference(),
            makeParameterEntityStart(),
            makeParameterEntityEnd(),
         ]);

         const denudedResult = result.map((x) => {
            delete x.pToken;
            return x;
         });
         expect(denudedResult).toEqual([
            new TextXToken('foo'),
            new CharRefXToken('D'),
            new ParameterEntityReferenceXToken('entityName'),
            new ParameterEntityStartXToken('entityName'),
            new ParameterEntityEndXToken('entityName'),
         ]);

         done();
      }));
});
