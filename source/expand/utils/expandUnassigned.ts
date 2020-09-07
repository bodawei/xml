/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';
import { strOrBlank } from 'sToken';
import {
   ElidedEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   XmlError,
   unassigned,
} from 'token';

import { UnassignedArray, UnassignedType } from '../../token/common/unassigned';

import { ExpandParams } from '../types';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityNameStack } from './EntityNameStack';

type ExpandUnassignedResult = {
   byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
   newValue: UnassignedArray;
};
type UnassignedExpanded = (result: ExpandUnassignedResult) => void;

type ParseResults = {
   byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
   unassignedFragment: UnassignedArray | void;
};

function expandPeRef(
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   isElementDecl: boolean,
   peRef: ParameterEntityReferencePToken,
   callback: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(peRef.name);
   const details = expandParams.entityDetails.getPEDetails(entityName);
   const result: ParseResults = {
      unassignedFragment: undefined,
      byproducts: [],
   };

   // §4.1.0: Well-formedness constraint: No Recursion
   //    A parsed entity must not contain a recursive reference to itself,
   //    either directly or indirectly.
   if (!details || nameStack.hasPEName(entityName)) {
      callback(result);
      return;
   }

   addProtoReplacementText(peRef, expandParams, nameStack, (addResult) => {
      if (!details.protoReplacementText) {
         result.byproducts = addResult.byproducts;
         callback(result);
         return;
      }

      const sTokenSource = entityValueToSTokenSource(
         details.protoReplacementText,
         expandParams.entityId,
      );
      sTokenSource.setConfVer(expandParams.confVer);

      unassigned.parseAllValues(sTokenSource, isElementDecl, (results?: UnassignedArray) => {
         callback({
            unassignedFragment: results,
            byproducts: addResult.byproducts,
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
   nameStack: EntityNameStack,
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
      expanded({ newValue: [...value], byproducts: [] });
      return;
   }

   const expandRef = expandPeRef.bind(undefined, expandParams, nameStack, isElementDecl);

   // Process expand all the peRefs potentially very asynchronously.
   doAsyncLoop(peRefs, expandRef, (results) => {
      const allByproducts: Array<XmlError | ElidedEntityDeclarationPToken> = [];
      const newValue: UnassignedArray = [];
      let peRefIndex = 0;

      // Insert the expanded values in place of the references
      for (const element of value) {
         if (element.type !== UnassignedType.REFERENCE) {
            newValue.push(element);
            continue;
         }

         const { unassignedFragment, byproducts } = results[peRefIndex];

         peRefIndex++;
         allByproducts.push(...byproducts);

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

      expanded({ newValue, byproducts: allByproducts });
   });
}

export { expandUnassigned, UnassignedExpanded };
