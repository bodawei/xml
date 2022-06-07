/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ParameterEntityStartPToken } from 'token';

import { parameterEntityReferenceCheck } from '../token/parameterEntityReferenceCheck';

function parameterEntityStartCheck(
   pToken: ParameterEntityStartPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   parameterEntityReferenceCheck(pToken.referencePToken, collector, confVer);
}

export { parameterEntityStartCheck };
