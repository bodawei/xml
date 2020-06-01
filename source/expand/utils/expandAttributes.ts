/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';
import { strOrBlank, STokenSource } from 'sToken';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   AttributeValuePToken,
   EntityValuePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   GeneralEntityReferencePToken,
   XmlError,
} from 'token';

import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { lookupPredefinedEntityValue } from './lookupPredefinedEntityValue';
import { addProtoReplacementText } from './addProtoReplacementText';
import { GEDetails } from './EntityDetails';
import { ExpandParams } from '../types';
import { EntityNameStack } from './EntityNameStack';

type AttrValueObj = { value: AttributeValuePToken };

type ExpandAttrResult = {
   newValue: AttributeValuePToken;
   errors: Array<XmlError>;
};
type AttrExpanded = (result: ExpandAttrResult) => void;

type ParseResults = {
   expandedFragment: AttributeValuePToken | void;
   preparseValue: EntityValuePToken | void;
   errors: Array<XmlError>;
};

/*
 * Finally, given a definitely populated geInfo.valueCache, parse the resulting
 * text as an attribute value, recursively expand it, and call back with
 * the results
 */
function parseEntityValueAsAttributeValue(
   geDetails: GEDetails,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   errors: Array<XmlError>,
   callback: (result: ParseResults) => void,
): void {
   const entityValue = geDetails.protoReplacementText;
   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
   const sTokenSource: STokenSource = entityValueToSTokenSource(entityValue!, expandParams.emd);

   expandParams.utils.parseAttributeValue(sTokenSource, (result) => {
      // If it still didn't parse into anything useful, abort.
      if (!result.newValue) {
         callback({
            expandedFragment: undefined,
            preparseValue: undefined,
            errors: [...errors, ...result.errors],
         });
         return;
      }

      /*
       * And for the head-exploding moment. Now that we have retrieved the replacement text
       * for a general entity and parsed it as an AttributeValuePToken, we must now start
       * the same process over again on that fragment, since it may, itself, have
       * general entity references in it that need to be expanded.
       */
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      expandOneAttribute(result.newValue, expandParams, nameStack, (recurResults) => {
         callback({
            expandedFragment: recurResults.newValue,
            preparseValue: entityValue,
            errors: [...errors, ...result.errors, ...recurResults.errors],
         });
      });
   });
}

/*
 * For each general entity reference, retrieve its replacement text in the
 * form of an EntityValuePToken, and then parse that text as an attribute value.
 */
function expandGeRef(
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   geRef: GeneralEntityReferencePToken,
   geRefExpanded: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(geRef.name);
   const geDetails = expandParams.entityDetails.getGEDetails(entityName);
   const result: ParseResults = {
      expandedFragment: undefined,
      preparseValue: undefined,
      errors: [],
   };

   // If there is no declaration, check if it is one of the predefined entities.
   if (!geDetails) {
      result.preparseValue = lookupPredefinedEntityValue(entityName);
      // In this case, we know that the EntityValuePToken and AttributeValuePToken are the same
      result.expandedFragment = result.preparseValue as AttributeValuePToken | void;

      geRefExpanded(result);
      return;
   }

   /*
    * §4.1.0: Well-Formedness Constraint: No Recursion
    *     A parsed entity must not contain a recursive reference
    *     to itself, either directly or indirectly.
    * §4.4.0 unparsed entities may not be referenced in content
    */
   if (nameStack.hasGEName(entityName) || geDetails.isUnparsed) {
      geRefExpanded(result);
      return;
   }

   const newRefChain = nameStack.cloneWithGEName(entityName);

   if (geDetails.protoReplacementText) {
      parseEntityValueAsAttributeValue(geDetails, expandParams, newRefChain, [], geRefExpanded);
      return;
   }

   addProtoReplacementText(geRef, expandParams, nameStack, (newErrors) => {
      if (!geDetails.protoReplacementText) {
         result.errors = newErrors;
         geRefExpanded(result);
         return;
      }

      parseEntityValueAsAttributeValue(
         geDetails,
         expandParams,
         newRefChain,
         newErrors,
         geRefExpanded,
      );
   });
}

/*
 * This does the "outer" work of the expansion process. We
 * identify the general entity references in the attribute value
 * and then call another routine to expand each of those.
 * We then stitch the attribute value back together replacing
 * each general entity reference with its expanded contents.
 */
function expandOneAttribute(
   attValue: AttributeValuePToken,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   expanded: AttrExpanded,
): void {
   const geRefs: Array<GeneralEntityReferencePToken> = [];

   // Extract all the general entity references
   for (const element of attValue) {
      if (element.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         geRefs.push(element);
      }
   }

   if (geRefs.length === 0) {
      expanded({ newValue: attValue, errors: [] });
      return;
   }

   doAsyncLoop(geRefs, expandGeRef.bind(undefined, expandParams, nameStack), (expandedDetails) => {
      const allErrors: Array<XmlError> = [];
      const newValue: AttributeValuePToken = [];
      let geRefIndex = 0;

      // Go through the attribute value, replacing references with the expanded fragment.
      for (const element of attValue) {
         if (element.type !== GENERAL_ENTITY_REFERENCE_PTOKEN) {
            newValue.push(element);
            continue;
         }

         const { expandedFragment, preparseValue, errors } = expandedDetails[geRefIndex];

         geRefIndex++;
         allErrors.push(...errors);

         if (!expandedFragment) {
            // For some reason couldn't expand. Just put it in the array
            newValue.push(element);
         } else {
            // expanded! wrap the expanded contents with a start and end
            newValue.push(
               new GeneralEntityStartPToken(element, preparseValue),
               ...expandedFragment,
               new GeneralEntityEndPToken(element, preparseValue),
            );
         }
      }

      expanded({ newValue, errors: allErrors });
   });
}

/*
 * Given either a set of attributes, or a set of attribute definition, extract
 * each of the values and expand any general entity references in them.
 * Deliver back any errors encountered during that expansion, as well as the
 * expanded value.
 *
 * For the purposes of keeping yourself oriented in all the parsing, recall
 * that the AttributeValuePTokens we are given have already had character
 * references and general entity references parsed into PTokens. Our job
 * here is to parse the replacement text that those reference and return the
 * more complete AttributeValuePTokens.
 */
function expandAttributes(
   valueObjects: Array<AttrValueObj>,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   expanded: (results: Array<ExpandAttrResult>) => void,
): void {
   const attributeValues: Array<AttributeValuePToken> = [];

   for (const valueObj of valueObjects) {
      attributeValues.push(valueObj.value);
   }

   function process(attributeValue: AttributeValuePToken, callback: AttrExpanded): void {
      expandOneAttribute(attributeValue, expandParams, nameStack, callback);
   }

   doAsyncLoop(attributeValues, process, expanded);
}

export { expandAttributes, AttrExpanded, ExpandAttrResult };
