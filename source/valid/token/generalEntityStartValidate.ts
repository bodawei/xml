/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { GeneralEntityStartPToken } from 'token';
import { strOrBlank } from 'sToken';

import { ancestorPERefsValidate } from '../common/ancestorPERefsValidate';
import { PREDEFINED_ENTITIES } from '../common/constants';
import { geRefValidate } from '../common/geRefValidate';
import { ValidityState } from '../common/validityState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function generalEntityStartValidate(
   startPToken: GeneralEntityStartPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   const name = strOrBlank(startPToken.referencePToken.name);
   const isPredefined = PREDEFINED_ENTITIES.includes(name);
   ec.setPos(startPToken.referencePToken.open);

   const details = state.generalEntities[name];

   // §2.9.0 Validity Constraint: Standalone Document Declaration
   //    ...entities (other than amp, lt, gt, apos, quot), if references to
   //    those entities appear in the document...
   ec.check(
      details?.isExternalMarkupDeclaration && state.isStandalone && !isPredefined,
      VID.ENTITYREF_EXTERNAL,
      [name],
      startPToken.referencePToken.open,
   );

   geRefValidate(startPToken.referencePToken, state, ec);

   ancestorPERefsValidate(startPToken, state, ec);
}

export { generalEntityStartValidate };
