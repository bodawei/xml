/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   isTextPToken,
} from 'pToken';
import { LiteralValuePToken } from 'token';

import { charCheck } from '../common/charCheck';

import { checkMap } from '../checkMap';

function literalValueCheck(
   pToken: LiteralValuePToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   for (const item of pToken) {
      if (isTextPToken(item)) {
         collector.setPos(item.text);
         charCheck(item.text, collector, confVer, false);
      } else if (
         item.type === CHARREF_PTOKEN ||
         item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN ||
         item.type === GENERAL_ENTITY_REFERENCE_PTOKEN
      ) {
         // Why not checking reference in start and end?
         checkMap[item.type]?.(item, collector, confVer);
      }
   }
}

export { literalValueCheck };
