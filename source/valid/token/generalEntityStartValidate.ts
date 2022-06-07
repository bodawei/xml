/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { strOrBlank } from 'sToken';
import { GeneralEntityStartPToken } from 'token';

import { ancestorPERefsValidate } from '../common/ancestorPERefsValidate';
import { PREDEFINED_ENTITIES } from '../common/constants';
import { geRefValidate } from '../common/geRefValidate';
import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function generalEntityStartValidate(
   startPToken: GeneralEntityStartPToken,
   state: ValidityState,
   coll: Collector,
): void {
   const name = strOrBlank(startPToken.referencePToken.name);
   const isPredefined = PREDEFINED_ENTITIES.includes(name);
   coll.setPos(startPToken.referencePToken.open);

   const details = state.generalEntities[name];

   // §2.9.0 Validity Constraint: Standalone Document Declaration
   //    ...entities (other than amp, lt, gt, apos, quot), if references to
   //    those entities appear in the document...
   coll.check(
      details?.isExternalMarkupDeclaration && state.isStandalone && !isPredefined,
      VID.ENTITYREF_EXTERNAL,
      [name],
      startPToken.referencePToken.open,
   );

   geRefValidate(startPToken.referencePToken, state, coll);

   ancestorPERefsValidate(startPToken, state, coll);
}

export { generalEntityStartValidate };
