/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { WellFormedError } from '../error/WellFormedError';

import { DocTypeEndPToken } from 'token';

const WFEID = WellFormedError.ID;

function docTypeEndCheck(pToken: DocTypeEndPToken, ec: ErrorCollector): void {
   ec.setPos(pToken.closeSubset);

   if (!pToken.docTypeStartPToken.openSubset) {
      ec.check(pToken.closeSubset, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   // If there is no close, and no closeInternalSubset, this won't get a very good position.
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.DOCTYPE_NO_CLOSE);
}

export { docTypeEndCheck };
