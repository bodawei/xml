/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityStartPToken } from 'token';
import { strOrBlank } from 'sToken';

import { ValidityState } from '../common/validityState';
import { validCodes } from '../error/validCodes';
import { ancestorPERefsValidate } from '../common/ancestorPERefsValidate';

const VID = validCodes.id;

function parameterEntityStartValidate(
   startPToken: ParameterEntityStartPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   const name = strOrBlank(startPToken.referencePToken.name);
   ec.setPos(startPToken.referencePToken.open);

   // §2.9.0 Validity Constraint: Standalone Document Declaration
   //    ...entities (other than amp, lt, gt, apos, quot), if references to
   //    those entities appear in the document...
   const details = state.parameterEntities[name];

   ec.check(
      details?.isExternalMarkupDeclaration && state.isStandalone,
      VID.ENTITYREF_EXTERNAL,
      [name],
      startPToken.referencePToken.open,
   );

   ancestorPERefsValidate(startPToken, state, ec);
}

export { parameterEntityStartValidate };
