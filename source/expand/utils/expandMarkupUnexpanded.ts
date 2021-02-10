/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';

import {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ParameterEntityReferencePToken,
   UnexpandedMarkupToken,
} from 'pToken';
import { strOrBlank } from 'sToken';
import {
   ElidedEntityDeclarationPToken,
   XmlError,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   EntityValueElement,
} from 'token';

import { ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityContextStack } from './EntityContextStack';

interface ExpandResults {
   byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
   expandedTokens: Array<EntityValueElement> | undefined;
}

function expandPeRef(
   expandParams: ExpandParams,
   entityContextStack: EntityContextStack,
   peRef: ParameterEntityReferencePToken,
   callback: (result: ExpandResults) => void,
): void {
   const entityName = strOrBlank(peRef.name);
   const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
   const result: ExpandResults = {
      expandedTokens: undefined,
      byproducts: [],
   };

   // §4.1.0: Well-formedness constraint: No Recursion
   //    A parsed entity must not contain a recursive reference to itself,
   //    either directly or indirectly.
   if (!entityDetails || entityContextStack.hasName(peRef)) {
      callback(result);
      return;
   }

   addProtoReplacementText(peRef, expandParams, entityContextStack, (addResult) => {
      if (!entityDetails.protoReplacementText) {
         result.byproducts = addResult.byproducts;
         callback(result);
         return;
      }

      callback({
         expandedTokens: entityDetails.protoReplacementText,
         byproducts: addResult.byproducts,
      });
   });
}

/*
 * Given an array of unexpanded values (only found in the four declarations:
 * AttList, Element, Entity, Notation), expand any PE Refs within it and
 * produce an STokenStream with those contents
 */
function expandMarkupUnexpanded(
   value: ReadonlyArray<UnexpandedMarkupToken>,
   expandParams: ExpandParams,
   entityContextStack: EntityContextStack,
   expanded: (result: ExpandResults) => void,
): void {
   const peRefs: Array<ParameterEntityReferencePToken> = [];

   for (const element of value) {
      if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         peRefs.push(element);
      }
   }

   if (peRefs.length === 0) {
      expanded({ expandedTokens: [...value], byproducts: [] });
      return;
   }

   const expandRef = expandPeRef.bind(undefined, expandParams, entityContextStack);

   // Process expand all the peRefs potentially very asynchronously.
   doAsyncLoop(peRefs, expandRef, (results) => {
      const allByproducts: Array<XmlError | ElidedEntityDeclarationPToken> = [];
      const newValue: Array<EntityValueElement> = [];
      let peRefIndex = 0;

      // Insert the expanded values in place of the references
      for (const element of value) {
         if (element.type !== PARAMETER_ENTITY_REFERENCE_PTOKEN) {
            newValue.push(element);
            continue;
         }

         const { expandedTokens, byproducts } = results[peRefIndex];

         peRefIndex++;
         allByproducts.push(...byproducts);

         if (!expandedTokens) {
            // For some reason couldn't expand. Just put it in the array
            newValue.push(element);
         } else {
            newValue.push(
               new ParameterEntityStartPToken(element),
               ...expandedTokens,
               new ParameterEntityEndPToken(element),
            );
         }
      }

      expanded({ expandedTokens: newValue, byproducts: allByproducts });
   });
}

export { expandMarkupUnexpanded, ExpandResults };
