/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { Problem } from 'basic';
import { GeneralEntityReferencePToken, ParameterEntityReferencePToken } from 'pToken';

import { ElidedEntityDeclarationPToken, EntityValuePToken } from 'token';

import { expandEntityValue } from './expandEntityValue';
import { ExpandParams } from '../types';
import { EntityContextStack } from './EntityContextStack';
import { PARAMETER_ENTITY_DECLARATION_PTOKEN, externalIdToEntityId } from 'pToken';

interface AddProtoReplacementTextResult {
   byproducts: Array<Problem | ElidedEntityDeclarationPToken>;
}

type Done = (result: AddProtoReplacementTextResult) => void;

/*
 * Given an entity reference, make sure there is a protoReplacementText
 * value for it in the entityDetails. If not, construct that text and
 * add to the entityDetails.  In addition, make sure that the protoReplacementText
 * values for all the parameter entities it references have also been
 * populated (and the ones that they reference, and so on).
 *
 * If the entity, or one of the entities it references, can not be found, they
 * will not be populated, of course.
 *
 * The "protoReplacementText" here really means an EntityValueToken, which is
 * one step away from being the replacementText for the entity (the step away
 * being to have the various "metadata" like pe ref start tokens removed, and
 * all the text values put together).
 *
 * NOTE: entityContextStack is where the reference is found, but does not include it.
 */
function addProtoReplacementText(
   reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   expandParams: ExpandParams,
   entityContextStack: EntityContextStack,
   done: Done,
): void {
   const { entityDetails, utils } = expandParams;
   const details = entityDetails.getReferencedDetails(reference);

   if (
      !details ||
      details.protoReplacementText ||
      !details.token.externalId ||
      !expandParams.loadExternalEntities
   ) {
      done({ byproducts: [] });
      return;
   }

   if (details.isLoading) {
      entityDetails.waitForLoading(details.token, () => {
         done({ byproducts: [] });
      });
      return;
   }

   const entityId = utils.resolveEntityId(
      details.entityLoc,
      externalIdToEntityId(details.token.externalId),
   );

   const { sTokenSource, getErrors } = utils.retrieveExternalEntity(entityId);
   sTokenSource.setConfVer(expandParams.confVer);

   entityDetails.loadingEntity(details.token);
   entityDetails.waitForLoading(details.token, (info) => {
      done({
         byproducts: info.byproducts,
      });
   });

   utils.parseEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken | void) => {
      const newStack = entityContextStack.cloneWithRef(reference, details.entityLoc);

      if (!entityValuePToken) {
         entityDetails.updateDeclaredValue(
            details.token,
            details.protoReplacementText,
            getErrors(),
         );
         return;
      }

      expandEntityValue(entityValuePToken, expandParams, newStack, (results) => {
         const byproducts = [...getErrors(), ...results.byproducts];

         if (details.token.type === PARAMETER_ENTITY_DECLARATION_PTOKEN) {
            byproducts.push(new ElidedEntityDeclarationPToken(details.token, entityValuePToken));
         }

         entityDetails.updateDeclaredValue(details.token, results.newValue, byproducts);
      });
   });
}

export { addProtoReplacementText, AddProtoReplacementTextResult };
