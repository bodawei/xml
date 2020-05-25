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

import { addProtoReplacementText } from './addProtoReplacementText';

type ExpandedResult = {
   newValue: EntityValuePToken;
   errors: Array<XmlError>;
};

/*
 * Simply sweep through an EntityValuePToken and return any ParameterEntityInfo's
 * found that do not already have replacement text in thedetails.
 */
function entitiesWithoutReplacementText(
   value: EntityValuePToken,
   entityDetails: EntityDetails,
): Array<ParameterEntityReferencePToken> {
   const withoutRT: Array<ParameterEntityReferencePToken> = [];

   for (const subToken of value) {
      if (subToken.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         const elementName = strOrBlank(subToken.name);
         const details = entityDetails.getPEDetails(elementName);

         if (details && !details.protoReplacementText) {
            withoutRT.push(subToken);
         }
      }
   }

   return withoutRT;
}

/*
 * When we get here, we are assured that all parameter entities have been loaded
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
         const details = expandParams.entityDetails.getPEDetails(entryName);

         if (details) {
            newValue = [
               ...newValue,
               new ParameterEntityStartPToken(element),
               ...details.protoReplacementText!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
               new ParameterEntityEndPToken(element),
            ];
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
 * Note: This will modify the epandParams.entityDetails with the EntityValuePTokens
 * of any external parameter entities that this retrieved.
 */
function expandEntityValue(
   value: EntityValuePToken,
   expandParams: ExpandParams,
   peRefChain: Array<string>,
   expanded: (result: ExpandedResult) => void,
): void {
   const allErrors: Array<XmlError> = [];
   const entitiesWithoutRT = entitiesWithoutReplacementText(value, expandParams.entityDetails);
   let remainingEntities = entitiesWithoutRT.length;

   if (remainingEntities === 0) {
      expandValue(value, expandParams, expanded, []);
      return;
   }

   for (const reference of entitiesWithoutRT) {
      // eslint-disable-next-line no-loop-func
      addProtoReplacementText(reference, expandParams, [], (errors) => {
         allErrors.push(...errors);
         remainingEntities--;

         if (remainingEntities === 0) {
            expandValue(value, expandParams, expanded, allErrors);
         }
      });
   }
}

export { ExpandParams, expandEntityValue };
