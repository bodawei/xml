/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { LiteralPToken } from 'token';

import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { literalCheck } from '../literalCheck';
import { literalValueCheck } from '../literalValueCheck';

jest.mock('../literalValueCheck');

const WFEID = wellFormedErrorCodes.id;

describe('literalCheck() (unit)', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let literalPToken: LiteralPToken;

   beforeEach(() => {
      literalPToken = {
         closeQuote: toSToken('"'),
         openQuote: toSToken('"'),
         type: 'foo',
         value: [new TextPToken({ text: toSToken('xxx') })],
      };

      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('calls literalValue.checkWellFormed() to check the value', () => {
      literalCheck(literalPToken, collector, confVer, 'foo');

      expect(literalValueCheck).toHaveBeenCalledWith(literalPToken.value, collector, confVer);
   });

   it('reports an error if there is no opening quote', () => {
      delete literalPToken.openQuote;

      literalCheck(literalPToken, collector, confVer, 'aType');

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.LITERAL_NO_OPEN_QUOTE,
         lastPosition: undefined,
         params: ['aType'],
      });
   });

   it('reports an error if there is no close quote', () => {
      delete literalPToken.closeQuote;

      literalCheck(literalPToken, collector, confVer, 'aType');

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.LITERAL_NO_CLOSE_QUOTE,
         lastPosition: literalPToken.openQuote,
         params: ['aType'],
      });
   });
});
