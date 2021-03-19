/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { LiteralPToken } from 'token';

import { WellFormedError } from '../error/WellFormedError';
import { literalValueCheck } from './literalValueCheck';

const WFEID = WellFormedError.ID;

function literalCheck(
   pTokenPart: LiteralPToken | undefined,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
   type: string,
   checkValue?: () => void,
): void {
   const pToken: LiteralPToken = pTokenPart || { value: [] };

   ec.setPos(pToken.openQuote);
   ec.check(!pToken.openQuote, WFEID.LITERAL_NO_OPEN_QUOTE, [type]);

   const pieces = pToken.value;
   literalValueCheck(pieces, ec, confVer);

   if (checkValue) {
      checkValue();
   }

   ec.setPos(pToken.closeQuote);

   ec.check(!pToken.closeQuote, WFEID.LITERAL_NO_CLOSE_QUOTE, [type]);
}

export { literalCheck };
