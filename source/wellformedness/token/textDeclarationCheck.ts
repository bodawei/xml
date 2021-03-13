/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from '../error/WellFormedError';
import { TextDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { checkCharWellFormed } from '../../token/common/misc';
import { InstructionField } from 'pToken';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const VERSION_10_1_REGEXP = /^[-a-zA-Z0-9_.:]+$/;

function checkFields(
   params: ReadonlyArray<InstructionField>,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   let foundEncoding = false;
   let foundVersion = false;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);

      ec.setPos(param.name);
      ec.check(nameText !== lcName, WFEID.TEXTDECL_PARAM_INVALID_CASE, [lcName, nameText]);

      switch (lcName) {
         case 'version':
            ec.check(foundVersion, WFEID.TEXTDECL_DUPLICATE_VERSION);
            foundVersion = true;
            ec.check(foundEncoding, WFEID.TEXTDECL_VERSION_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);

            // See §2.8 in 1.0/* and §4.3.4 in 1.1/*
            //    And then see interpretations,
            if (confVer.version === 1 && confVer.revision <= 2) {
               ec.check(!VERSION_10_1_REGEXP.test(valueText), WFEID.TEXTDECL_VERSION_INVALD, [
                  "([a-zA-Z0-9_.:] | '-')+",
                  valueText,
               ]);
            } else if (confVer.version === 1 && confVer.revision > 2) {
               ec.check(valueText !== '1.0', WFEID.TEXTDECL_VERSION_INVALD, ['1.0', valueText]);
            } else if (confVer.version === 1.1) {
               ec.check(valueText !== '1.1' && valueText !== '1.0', WFEID.TEXTDECL_VERSION_INVALD, [
                  '1.0/1.1',
                  valueText,
               ]);
            }
            break;
         case 'encoding':
            ec.check(foundEncoding, WFEID.TEXTDECL_DUPLICATE_ENCODING);
            foundEncoding = true;

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(!ENCODING_REGEXP.test(valueText), WFEID.TEXTDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
      }
   }
}

function textDeclarationCheck(
   pToken: TextDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.TEXTDECL_SPACE_AFTER_OPEN);

   ec.setPos(pToken.target);
   checkCharWellFormed(pToken.target, ec, confVer);

   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.TEXTDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.TEXTDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET);

   checkFields(pToken.fields, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.TEXTDECL_NO_CLOSE);
}

export { textDeclarationCheck };
