/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlFatalError } from 'basic';
import { InstructionField } from 'pToken';
import { SToken } from 'sToken';

const S_REGEXP = /^[\t\r\n ]*$/;

function checkSpaceProblems(
   sToken: SToken | undefined,
   code: string,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const text = sToken?.originalStr || '';

   if (S_REGEXP.test(text) || confVer.version === 1) {
      return;
   }

   const chars = text.split('');

   for (const char of chars) {
      if (!S_REGEXP.test(char)) {
         // §2.11.0 Therefore, it is a fatal error to use them
         //    within the XML declaration or text declaration.
         ec.reportError(code, XmlFatalError, [char.charCodeAt(0).toString(16)]);
      }
   }
}

function checkSpaces(
   param: InstructionField,
   spaceCode: string,
   equalCode: string | undefined,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(param.nameSpace);
   checkSpaceProblems(param.nameSpace, spaceCode, ec, confVer);
   ec.setPos(param.equal);

   if (equalCode) {
      ec.check(!param.equal, equalCode);
   }

   ec.setPos(param.equalSpace);
   checkSpaceProblems(param.equalSpace, spaceCode, ec, confVer);
   ec.setPos(param.openQuote);
}
export { checkSpaceProblems, checkSpaces };
