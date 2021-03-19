/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { LiteralPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { literalCheck } from '../literalCheck';
import { literalValueCheck } from '../literalValueCheck';

jest.mock('../literalValueCheck');

describe('literalCheck() (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let literalPToken: LiteralPToken;

   beforeEach(() => {
      literalPToken = {
         type: 'foo',
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('xxx') })],
         closeQuote: toSToken('"'),
      };

      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
   });

   it('calls literalValue.checkWellFormed() to check the value', () => {
      literalCheck(literalPToken, mockErrorCollector, confVer, 'foo');

      expect(literalValueCheck).toHaveBeenCalledWith(
         literalPToken.value,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is no opening quote', () => {
      delete literalPToken.openQuote;

      literalCheck(literalPToken, mockErrorCollector, confVer, 'aType');

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.LITERAL_NO_OPEN_QUOTE,
         params: ['aType'],
         lastPosition: undefined,
      });
   });

   it('reports an error if there is no close quote', () => {
      delete literalPToken.closeQuote;

      literalCheck(literalPToken, mockErrorCollector, confVer, 'aType');

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE,
         params: ['aType'],
         lastPosition: literalPToken.openQuote,
      });
   });
});
