/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { WellFormedError } from 'error';
import { ProcessingInstructionPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import {
   checkName,
   checkCharWellFormed,
   checkWellFormedNameRecommendation,
} from '../../token/common/misc';

const WFEID = WellFormedError.ID;

function processingInstructionCheck(
   pToken: ProcessingInstructionPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const targetName = strOrBlank(pToken.target);
   const lcTarget = targetName.toLowerCase();
   const hasXml = lcTarget.indexOf('xml') !== -1;

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.PI_SPACE_AFTER_OPEN, [targetName]);

   ec.setPos(pToken.target);
   ec.check(!pToken.target, WFEID.PI_NO_TARGET);
   checkName(pToken.target, ec, confVer, WFEID.PI_TARGET_NAME_INVALID);
   ec.check(hasXml, WFEID.PI_TARGET_HAS_XML, [targetName]);
   checkWellFormedNameRecommendation(
      pToken.target,
      ec,
      confVer,
      'PI',
      XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED,
      XmlWarning.ID.PI_TARGET_XML_RESERVED,
   );

   ec.setPos(pToken.targetSpace);
   if (pToken.instruction) {
      ec.check(!pToken.targetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [targetName]);
   }

   ec.setPos(pToken.instruction);
   checkCharWellFormed(pToken.instruction, ec, confVer);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PI_NO_CLOSE, [targetName]);
}

export { processingInstructionCheck };
