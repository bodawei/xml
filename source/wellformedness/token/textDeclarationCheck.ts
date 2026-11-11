/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { strOrBlank } from 'basic';
import { InstructionField, TextDeclarationPToken } from 'pToken';

import { charCheck } from '../common/charCheck';
import { checkSpaceProblems, checkSpaces, checkVersionString } from '../common/xmlTextDeclUtils';
import { fatalErrorCodes } from '../error/fatalErrorCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const FEID = fatalErrorCodes.id;
const WFEID = wellFormedErrorCodes.id;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;

function checkFields(
   params: ReadonlyArray<InstructionField>,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   let foundEncoding = false;
   let foundVersion = false;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);

      collector.setPos(param.name);
      collector.check(nameText !== lcName, WFEID.TEXTDECL_PARAM_INVALID_CASE, [lcName, nameText]);

      switch (lcName) {
         case 'version':
            collector.check(foundVersion, WFEID.TEXTDECL_DUPLICATE_VERSION);
            foundVersion = true;
            collector.check(foundEncoding, WFEID.TEXTDECL_VERSION_INVALID_ORDER);

            checkSpaces(param, FEID.TEXTDECL_INVALID_SPACE, undefined, collector, confVer);
            collector.setPos(value);
            charCheck(value, collector, confVer, false);

            checkVersionString(valueText, false, collector, confVer);
            break;
         case 'encoding':
            collector.check(foundEncoding, WFEID.TEXTDECL_DUPLICATE_ENCODING);
            foundEncoding = true;

            checkSpaces(param, FEID.TEXTDECL_INVALID_SPACE, undefined, collector, confVer);
            collector.setPos(value);
            charCheck(value, collector, confVer, false);
            collector.check(!ENCODING_REGEXP.test(valueText), WFEID.TEXTDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
      }

      collector.setPos(param.valueSpace);
      checkSpaceProblems(param.valueSpace, FEID.TEXTDECL_INVALID_SPACE, collector, confVer);
   }

   collector.check(!foundEncoding, WFEID.TEXTDECL_ENCODING_MISSING);
}

function textDeclarationCheck(
   pToken: TextDeclarationPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);
   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.TEXTDECL_SPACE_AFTER_OPEN);
   checkSpaceProblems(pToken.openSpace, FEID.TEXTDECL_INVALID_SPACE, collector, confVer);

   collector.setPos(pToken.target);
   charCheck(pToken.target, collector, confVer, false);

   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      collector.check(target !== lcTarget, WFEID.TEXTDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      collector.report(WFEID.TEXTDECL_NO_TARGET);
   }

   collector.setPos(pToken.targetSpace);
   collector.check(!pToken.targetSpace, WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET);
   checkSpaceProblems(pToken.targetSpace, FEID.TEXTDECL_INVALID_SPACE, collector, confVer);

   checkFields(pToken.fields, collector, confVer);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.TEXTDECL_NO_CLOSE);
}

export { textDeclarationCheck };
