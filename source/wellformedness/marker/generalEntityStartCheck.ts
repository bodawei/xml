/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { GeneralEntityStartPToken } from 'token';

import { generalEntityReferenceCheck } from '../token/generalEntityReferenceCheck';

function generalEntityStartCheck(
   pToken: GeneralEntityStartPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   generalEntityReferenceCheck(pToken.referencePToken, collector, confVer);
}

export { generalEntityStartCheck };
