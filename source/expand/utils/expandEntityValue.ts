import { strOrBlank } from 'sToken';
import {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   EntityValuePToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   XmlError,
} from 'token';

import { ExpandParams } from '../types';
import { EntityDetails } from './EntityDetails';

import { setupReferencedEntity } from './setupReferencedEntity';

type ExpandedResult = {
   newValue: EntityValuePToken;
   errors: Array<XmlError>;
};

/*
 * Simply sweep through an EntityValuePToken and return any ParameterEntityInfo's
 * found that do not already have a cached EntityValuePToken value.
 */
function findUncachedEntities(
   value: EntityValuePToken,
   entityDetails: EntityDetails,
): Array<ParameterEntityReferencePToken> {
   const uncachedEntities: Array<ParameterEntityReferencePToken> = [];

   for (const subToken of value) {
      if (subToken.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         const elementName = strOrBlank(subToken.name);
         const peInfo = entityDetails.getPeDetails(elementName);

         if (peInfo && !peInfo.isInternal && !peInfo.valueCache) {
            uncachedEntities.push(subToken);
         }
      }
   }

   return uncachedEntities;
}

/*
 * When we gt here, we are assured that all parameter entities have been loaded
 * and expanded. Thus, we can finally expand the entity value
 *
 * Important notes:
 *   - An entity that can't be loaded for some reason will be expanded to ''
 *   - An entity reference to a missing declaration will be left unchanged
 */
function expandValue(
   value: EntityValuePToken,
   expandParams: ExpandParams,
   expanded: (result: ExpandedResult) => void,
   errors: Array<XmlError>,
): void {
   let newValue: EntityValuePToken = [];

   for (const element of value) {
      if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         const entryName = strOrBlank(element.name);
         const peInfo = expandParams.entityDetails.getPeDetails(entryName);

         if (peInfo) {
            newValue.push(new ParameterEntityStartPToken(element));
            newValue = newValue.concat(peInfo.valueCache!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            newValue.push(new ParameterEntityEndPToken(element));
            continue;
         }
      }

      newValue.push(element);
   }

   expanded({ newValue, errors });
}

/*
 * Given an entity value (either general or parameter) (which is, for reminder, a collection
 * of text, charRef, parameter entity references, and param entity start/stop tokens),  examine
 * all the references and replace them with start/stop pairs and the contents of the referenced
 * tokens.  Return a copy of the expanded value along with any errors that might have happend
 * while doing that.
 *
 * Note: This will modify the epandParams.entityCache.*.valueCache with the EntityValuePTokens
 * of any external parameter entities that this retrieved.
 *
 * NOTE: This avoids recursive calls by the caller not inserting a PE declaration into the
 * cache until it has already called this to process the value.
 */
function expandEntityValue(
   value: EntityValuePToken,
   expandParams: ExpandParams,
   expanded: (result: ExpandedResult) => void,
): void {
   const missingEntities = findUncachedEntities(value, expandParams.entityDetails);
   let remainingEntities = missingEntities.length;

   if (remainingEntities === 0) {
      expandValue(value, expandParams, expanded, []);
      return;
   }

   for (const reference of missingEntities) {
      // eslint-disable-next-line no-loop-func
      setupReferencedEntity(reference, expandParams, (errors) => {
         remainingEntities--;

         if (remainingEntities === 0) {
            expandValue(value, expandParams, expanded, errors);
         }
      });
   }
}

export { ExpandParams, expandEntityValue };
