/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { LiteralPToken } from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';
import { literalValueCheck } from './literalValueCheck';

const WFEID = wellFormedErrorCodes.id;

function literalCheck(
   pTokenPart: LiteralPToken | undefined,
   collector: Collector,
   confVer: ConformanceVersion,
   type: string,
   checkValue?: () => void,
): void {
   const pToken: LiteralPToken = pTokenPart || { value: [] };

   collector.setPos(pToken.openQuote);
   collector.check(!pToken.openQuote, WFEID.LITERAL_NO_OPEN_QUOTE, [type]);

   const pieces = pToken.value;
   literalValueCheck(pieces, collector, confVer);

   if (checkValue) {
      checkValue();
   }

   collector.setPos(pToken.closeQuote);

   collector.check(!pToken.closeQuote, WFEID.LITERAL_NO_CLOSE_QUOTE, [type]);
}

export { literalCheck };
