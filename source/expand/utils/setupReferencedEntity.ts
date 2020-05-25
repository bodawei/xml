/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import {
   EntityValuePToken,
   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
   XmlError,
} from 'token';

import { expandEntityValue } from './expandEntityValue';
import { ExpandParams } from '../types';

type Done = (result: Array<XmlError>) => void;

/*
 * Given an entity reference, make sure the referenced entity is in the cache,
 * and recursively retrieve any PE entities it's value references.
 * The entity, and all of its referenced entities are not guaranteed to have been
 * populated by the time this returns, since in some cases the entities may not be
 * locatable.
 */
function setupReferencedEntity(
   reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   expandParams: ExpandParams,
   done: Done,
): void {
   const { entityDetails, utils, emd } = expandParams;
   const entityInfo = entityDetails.getReferencedDetails(reference);

   if (!entityInfo || entityInfo.protoReplacementText || entityInfo.isLoading) {
      if (entityInfo && entityInfo.isLoading) {
         entityDetails.waitForLoading(entityInfo.token, (info) => done(info.errors));
      } else {
         done([]);
      }

      return;
   }

   const { sTokenSource, getErrors } = utils.retrieveExternalEntity(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      entityInfo.token.externalId!,
      emd,
   );

   entityDetails.loadingEntity(entityInfo.token);

   entityDetails.waitForLoading(entityInfo.token, (info) => done(info.errors));
   utils.parseEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken | void) => {
      if (!entityValuePToken) {
         entityDetails.updateDeclaredValue(
            entityInfo.token,
            entityInfo.protoReplacementText,
            getErrors(),
         );
         return;
      }

      expandEntityValue(entityValuePToken, expandParams, (results) => {
         // losing errors
         entityDetails.updateDeclaredValue(entityInfo.token, results.newValue, getErrors());
      });
   });
}

export { setupReferencedEntity };
