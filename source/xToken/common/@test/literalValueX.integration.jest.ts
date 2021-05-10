/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import {
   makeCharRef,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeTextPToken,
} from 'token-test';

import { GeneralEntityEndXToken } from '../../marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from '../../marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../../token/charRefXToken';
import { GeneralEntityReferenceXToken } from '../../token/generalEntityReferenceXToken';
import { ParameterEntityReferenceXToken } from '../../token/parameterEntityReferenceXToken';
import { TextXToken } from '../../token/textXToken';

import { makeLiteralValueX } from '../literalValueX';

describe('literalValue (integration)', () => {
   it('converts intput PToken into a set of XTokens', (done) => {
      const result = makeLiteralValueX([
         makeTextPToken('foo'),
         makeCharRef(),
         makeParameterEntityReference(),
         makeParameterEntityStart(),
         makeParameterEntityEnd(),
         makeGeneralEntityReference(),
         makeGeneralEntityStart(),
         makeGeneralEntityEnd(),
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
         new GeneralEntityReferenceXToken('testRef'),
         new GeneralEntityStartXToken('testRef'),
         new GeneralEntityEndXToken('testRef'),
      ]);

      done();
   });
});
