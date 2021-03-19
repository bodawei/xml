/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { CharDataPToken } from 'token';

import { charCheck } from '../common/charCheck';

function charDataCheck(
   pToken: CharDataPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.text);
   charCheck(pToken.text, ec, confVer);
}

export { charDataCheck };
