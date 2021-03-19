/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { ProcessingInstructionPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { charCheck } from '../common/charCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { nameCheck } from '../common/nameCheck';
import { WellFormedError } from '../error/WellFormedError';

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
   nameCheck(pToken.target, ec, confVer, WFEID.PI_TARGET_NAME_INVALID);
   // Note that while §2.3.0 disallows any name that STARTS with xml, §2.6.0
   // Seems to disallow XML anywhere in the name of a PI target.
   ec.check(hasXml, WFEID.PI_TARGET_HAS_XML, [targetName]);
   nameXmlCheck(
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
   charCheck(pToken.instruction, ec, confVer);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PI_NO_CLOSE, [targetName]);
}

export { processingInstructionCheck };
