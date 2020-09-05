import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank } from 'sToken';
import { ConditionalPToken } from 'token';

const WFEID = WellFormedError.ID;

function checkConditionalStartWellFormed(
   pToken: ConditionalPToken | undefined,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   if (!pToken) {
      return;
   }

   const SECTION_TYPES = ['INCLUDE', 'IGNORE'];

   const sectionType = strOrBlank(pToken.sectionType);
   const ucSectionType = sectionType.toUpperCase();
   const knownSectionType = SECTION_TYPES.indexOf(ucSectionType) !== -1;

   ec.setPos(pToken.sectionType);
   ec.check(!knownSectionType, WFEID.CONDITIONAL_UNKNOWN, [sectionType]);

   if (knownSectionType) {
      ec.check(sectionType !== ucSectionType, WFEID.CONDITIONAL_INVALID_CASE, [
         sectionType,
         ucSectionType,
      ]);
   }

   ec.setPos(pToken.bracket);
   ec.check(!pToken.bracket, WFEID.CONDITIONAL_NO_SECOND_BRACKET);
}

export default checkConditionalStartWellFormed;
