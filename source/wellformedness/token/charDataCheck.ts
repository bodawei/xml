/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { CharDataPToken } from 'token';

import misc from '../../token/common/misc';

function charDataCheck(
   pToken: CharDataPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.text);
   misc.checkCharWellFormed(pToken.text, ec, confVer);
}

export { charDataCheck };
