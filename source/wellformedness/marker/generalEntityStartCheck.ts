/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { GeneralEntityStartPToken } from 'token';

import { generalEntityReferenceCheck } from '../token/generalEntityReferenceCheck';

function generalEntityStartCheck(
   pToken: GeneralEntityStartPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   generalEntityReferenceCheck(pToken.referencePToken, ec, confVer);
}

export { generalEntityStartCheck };
