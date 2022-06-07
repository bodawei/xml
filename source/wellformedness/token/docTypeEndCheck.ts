/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { DocTypeEndPToken } from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function docTypeEndCheck(pToken: DocTypeEndPToken, collector: Collector): void {
   collector.setPos(pToken.closeSubset);

   if (!pToken.docTypeStartPToken.openSubset) {
      collector.check(pToken.closeSubset, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   // If there is no close, and no closeSubset, this won't get a very good position.
   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.DOCTYPE_NO_CLOSE);
}

export { docTypeEndCheck };
