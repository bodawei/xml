/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ProcessingInstructionPToken } from 'pToken';
import { strOrBlank } from 'basic';

import { charCheck } from '../common/charCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { nameCheck } from '../common/nameCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

function processingInstructionCheck(
   pToken: ProcessingInstructionPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const targetName = strOrBlank(pToken.target);
   const lcTarget = targetName.toLowerCase();
   const hasXml = lcTarget.indexOf('xml') !== -1;

   collector.setPos(pToken.open);
   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.PI_SPACE_AFTER_OPEN, [targetName]);

   collector.setPos(pToken.target);
   collector.check(!pToken.target, WFEID.PI_NO_TARGET);
   nameCheck(pToken.target, collector, confVer, WFEID.PI_TARGET_NAME_INVALID);
   // Note that while §2.3.0 disallows any name that STARTS with xml, §2.6.0
   // Seems to disallow XML anywhere in the name of a PI target.
   collector.check(hasXml, WFEID.PI_TARGET_HAS_XML, [targetName]);
   nameXmlCheck(
      pToken.target,
      collector,
      confVer,
      'PI',
      WID.PI_TARGET_XMLDASH_RESERVED,
      WID.PI_TARGET_XML_RESERVED,
   );

   collector.setPos(pToken.targetSpace);
   if (pToken.instruction) {
      collector.check(!pToken.targetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [targetName]);
   }

   collector.setPos(pToken.instruction);
   charCheck(pToken.instruction, collector, confVer, false);
   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.PI_NO_CLOSE, [targetName]);
}

export { processingInstructionCheck };
