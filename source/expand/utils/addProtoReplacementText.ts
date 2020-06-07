/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import {
   EntityValuePToken,
   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
   XmlError,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'token';

import { expandEntityValue } from './expandEntityValue';
import { ExpandParams } from '../types';
import { strOrBlank } from 'sToken';
import { EntityNameStack } from './EntityNameStack';

type Done = (result: Array<XmlError>) => void;

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
 * NOTE: nameStack is where the reference is found, but does not include it.
 */
function addProtoReplacementText(
   reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   done: Done,
): void {
   const { entityDetails, utils, emd } = expandParams;
   const details = entityDetails.getReferencedDetails(reference);

   if (
      !details ||
      details.protoReplacementText ||
      !details.token.externalId ||
      !expandParams.loadExternalEntities
   ) {
      done([]);
      return;
   }

   if (details.isLoading) {
      entityDetails.waitForLoading(details.token, (info) => done(info.errors));
      return;
   }

   const { sTokenSource, getErrors } = utils.retrieveExternalEntity(details.token.externalId, emd);

   entityDetails.loadingEntity(details.token);
   entityDetails.waitForLoading(details.token, (info) => done(info.errors));

   utils.parseEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken | void) => {
      const newStack =
         reference.type === PARAMETER_ENTITY_REFERENCE_PTOKEN
            ? nameStack.cloneWithPEName(strOrBlank(reference.name))
            : nameStack.cloneWithGEName(strOrBlank(reference.name));

      if (!entityValuePToken) {
         entityDetails.updateDeclaredValue(
            details.token,
            details.protoReplacementText,
            getErrors(),
         );
         return;
      }

      expandEntityValue(entityValuePToken, expandParams, newStack, (results) => {
         entityDetails.updateDeclaredValue(details.token, results.newValue, [
            ...getErrors(),
            ...results.errors,
         ]);
      });
   });
}

export { addProtoReplacementText };
