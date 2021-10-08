/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityStartPToken } from 'token';
import { strOrBlank } from 'sToken';

import { ancestorPERefsValidate } from '../common/ancestorPERefsValidate';
import { ValidityState } from '../common/validityState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function parameterEntityStartValidate(
   startPToken: ParameterEntityStartPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   const name = strOrBlank(startPToken.referencePToken.name);
   ec.setPos(startPToken.referencePToken.open);

   // §2.9.0 Validity Constraint: Standalone Document Declaration
   //    The standalone document declaration must have the value "no" if
   //    any external markup declarations contain declarations of:
   //    ...entities (other than amp, lt, gt, apos, quot), if references to
   //    those entities appear in the document...
   // Note: We do not check the predefined entities since those are never PE refs.
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
