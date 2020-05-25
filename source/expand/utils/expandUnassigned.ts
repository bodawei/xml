/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';
import { strOrBlank } from 'sToken';
import { EntityValuePToken, ParameterEntityReferencePToken, XmlError, unassigned } from 'token';

import { UnassignedArray, UnassignedType } from '../../token/common/unassigned';

import { ExpandParams } from '../types';

import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { setupReferencedEntity } from './setupReferencedEntity';

type ExpandAttrResult = {
   newValue: UnassignedArray;
   errors: Array<XmlError>;
};
type UnassignedExpanded = (result: ExpandAttrResult) => void;

type ParseResults = {
   unassignedFragment: UnassignedArray | void;
   preparseValue: EntityValuePToken | void;
   errors: Array<XmlError>;
};

/*
 * Perfrom several basic santity checks on the general entity reference we want
 * to expand, returning appropriate results if needed. If those checks pass,
 * defer to another routine to set up and process the entity value.
 */
function expandPeRef(
   expandParams: ExpandParams,
   peRefChain: Array<string>,
   peRef: ParameterEntityReferencePToken,
   callback: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(peRef.name);
   const peInfo = expandParams.entityDetails.getPEDetails(entityName);

   // Stop processing if we find this entity reference is already being processed
   if (entityName !== '' && peRefChain.includes(entityName)) {
      callback({
         unassignedFragment: undefined,
         preparseValue: undefined,
         errors: [],
      });
      return;
   }

   // If there is no declaration, check if it is one of the predefined entities.
   // return nothing or the predefined value
   if (!peInfo) {
      callback({
         unassignedFragment: undefined,
         preparseValue: undefined,
         errors: [],
      });

      return;
   }

   const localRefChain = [...peRefChain, entityName];

   if (peInfo.protoReplacementText) {
      const sTokenSource = entityValueToSTokenSource(peInfo.protoReplacementText, expandParams.emd);
      unassigned.parseAllValues(sTokenSource, false, (results?: UnassignedArray) => {
         callback({
            unassignedFragment: results,
            preparseValue: undefined,
            errors: [],
         });
      });
      return;
   }

   // No valueCache, so try to load it.
   setupReferencedEntity(peRef, expandParams, (newErrors) => {
      const sTokenSource = entityValueToSTokenSource(
         peInfo.protoReplacementText || [],
         expandParams.emd,
      );
      unassigned.parseAllValues(sTokenSource, false, (results?: UnassignedArray) => {
         callback({
            unassignedFragment: results,
            preparseValue: undefined,
            errors: newErrors,
         });
      });
   });
}

/*
 * This does the "outer" work of the expansion process. We
 * identify the general entity references in the attribute value
 * and then call another routine to expand each of those.
 * We then stitch the attribute value back together replacing
 * each general entity reference with its expanded contents.
 */
function expandUnassignedInternal(
   value: UnassignedArray,
   expandParams: ExpandParams,
   peRefChain: Array<string>,
   expanded: UnassignedExpanded,
): void {
   const peRefs: Array<ParameterEntityReferencePToken> = [];

   for (const element of value) {
      if (element.type === UnassignedType.REFERENCE) {
         peRefs.push(element.token);
      }
   }

   if (peRefs.length === 0) {
      expanded({ newValue: value, errors: [] });
      return;
   }

   const expandRef = expandPeRef.bind(undefined, expandParams, peRefChain);

   // Process expand all the peRefs potentially very asynchronously.
   doAsyncLoop(peRefs, expandRef, (results) => {
      const allErrors: Array<XmlError> = [];
      const newValue: UnassignedArray = [];
      let peRefIndex = 0;

      // Now stitch the original attribute value together with expansions
      for (const element of value) {
         if (element.type !== UnassignedType.REFERENCE) {
            newValue.push(element);
            continue;
         }

         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         const { unassignedFragment, preparseValue, errors } = results[peRefIndex];

         peRefIndex++;
         allErrors.push(...errors);

         if (!unassignedFragment) {
            // For some reason couldn't expand. Just put it in the array
            newValue.push(element);
         } else {
            // expanded! wrap the expanded contents with a start and end
            newValue.push(
               {
                  type: UnassignedType.ENTITY_START,
                  token: element.token,
               },
               ...unassignedFragment,
               {
                  type: UnassignedType.ENTITY_END,
                  token: element.token,
               },
            );
         }
      }

      expanded({ newValue, errors: allErrors });
   });
}

/*
 */
function expandUnassigned(
   value: UnassignedArray,
   expandParams: ExpandParams,
   expanded: UnassignedExpanded,
): void {
   expandUnassignedInternal(value, expandParams, [], expanded);
}

export { expandUnassigned, UnassignedExpanded, ExpandAttrResult };
