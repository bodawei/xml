/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { CharDataPToken } from 'token';

import { charCheck } from '../common/charCheck';

function charDataCheck(
   pToken: CharDataPToken,
   collector: Collector,
   confVer: ConformanceVersion,
   inSecondPassText = false,
): void {
   collector.setPos(pToken.text);

   charCheck(pToken.text, collector, confVer, inSecondPassText);
}

export { charDataCheck };
