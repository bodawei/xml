/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityStartPToken } from 'token';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';
import { ancestorPERefsValidate } from './ancestorPERefsValidate';

const VID = validityConstraint.id;

function parameterEntityStartValidate(
   startPToken: ParameterEntityStartPToken,
   state: ValidateState,
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
      VID.ENTITYREF_EXTERNALLY_DECLARED,
      [name],
      startPToken.referencePToken.open,
   );

   ancestorPERefsValidate(startPToken, state, ec);
}

export { parameterEntityStartValidate };
