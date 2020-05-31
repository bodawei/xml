/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';
import { strOrBlank } from 'sToken';
import { EntityValuePToken, ParameterEntityReferencePToken, XmlError, unassigned } from 'token';

import { UnassignedArray, UnassignedType } from '../../token/common/unassigned';

import { ExpandParams } from '../types';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { addProtoReplacementText } from './addProtoReplacementText';

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

function expandPeRef(
   expandParams: ExpandParams,
   peRefChain: Array<string>,
   isElementDecl: boolean,
   peRef: ParameterEntityReferencePToken,
   callback: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(peRef.name);
   const details = expandParams.entityDetails.getPEDetails(entityName);
   const localRefChain = [...peRefChain, entityName];
   const result: ParseResults = {
      unassignedFragment: undefined,
      preparseValue: undefined,
      errors: [],
   };

   if (!details || peRefChain.includes(entityName)) {
      callback(result);
      return;
   }

   addProtoReplacementText(peRef, expandParams, localRefChain, (newErrors) => {
      if (!details.protoReplacementText) {
         result.errors = newErrors;
         callback(result);
         return;
      }

      const sTokenSource = entityValueToSTokenSource(
         details.protoReplacementText,
         expandParams.emd,
      );

      unassigned.parseAllValues(sTokenSource, isElementDecl, (results?: UnassignedArray) => {
         callback({
            unassignedFragment: results,
            preparseValue: undefined,
            errors: newErrors,
         });
      });
   });
}

/*
 * Given an unassigned array, locate all the parameter entity references in
 * it, and then replace each with the expanded contents.
 */
function expandUnassigned(
   value: UnassignedArray,
   expandParams: ExpandParams,
   peRefChain: Array<string>,
   isElementDecl: boolean,
   expanded: UnassignedExpanded,
): void {
   const peRefs: Array<ParameterEntityReferencePToken> = [];

   for (const element of value) {
      if (element.type === UnassignedType.REFERENCE) {
         peRefs.push(element.token);
      }
   }

   if (peRefs.length === 0) {
      expanded({ newValue: [...value], errors: [] });
      return;
   }

   const expandRef = expandPeRef.bind(undefined, expandParams, peRefChain, isElementDecl);

   // Process expand all the peRefs potentially very asynchronously.
   doAsyncLoop(peRefs, expandRef, (results) => {
      const allErrors: Array<XmlError> = [];
      const newValue: UnassignedArray = [];
      let peRefIndex = 0;

      // Insert the expanded values in place of the references
      for (const element of value) {
         if (element.type !== UnassignedType.REFERENCE) {
            newValue.push(element);
            continue;
         }

         const { unassignedFragment, errors } = results[peRefIndex];

         peRefIndex++;
         allErrors.push(...errors);

         if (!unassignedFragment) {
            // For some reason couldn't expand. Just put it in the array
            newValue.push(element);
         } else {
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

export { expandUnassigned, UnassignedExpanded, ExpandAttrResult };
