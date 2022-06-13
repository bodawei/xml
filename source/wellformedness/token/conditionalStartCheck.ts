import { Collector } from 'basic';
import { strOrBlank } from 'basic';
import { ConditionalStartPToken } from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function conditionalStartCheck(
   pToken: ConditionalStartPToken | undefined,
   collector: Collector,
): void {
   if (!pToken) {
      return;
   }

   const SECTION_TYPES = ['INCLUDE', 'IGNORE'];

   const sectionType = strOrBlank(pToken.sectionType);
   const ucSectionType = sectionType.toUpperCase();
   const knownSectionType = SECTION_TYPES.indexOf(ucSectionType) !== -1;

   collector.setPos(pToken.sectionType);
   collector.check(!knownSectionType, WFEID.CONDITIONAL_UNKNOWN, [sectionType]);

   if (knownSectionType) {
      collector.check(sectionType !== ucSectionType, WFEID.CONDITIONAL_INVALID_CASE, [
         sectionType,
         ucSectionType,
      ]);
   }

   collector.setPos(pToken.bracket);
   collector.check(!pToken.bracket, WFEID.CONDITIONAL_NO_SECOND_BRACKET);
}

export { conditionalStartCheck };
