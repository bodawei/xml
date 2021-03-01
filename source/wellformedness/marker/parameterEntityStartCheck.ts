/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';

import { parameterEntityReferenceCheck } from '../token/parameterEntityReferenceCheck';

import { ParameterEntityStartPToken } from '../../token/marker/parameterEntityStart';

function parameterEntityStartCheck(
   pToken: ParameterEntityStartPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   parameterEntityReferenceCheck(pToken.referencePToken, ec, confVer);
}

export { parameterEntityStartCheck };
