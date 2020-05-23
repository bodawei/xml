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

import { ExpandParams } from '../types';

import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { lookupPredefinedEntityValue } from './lookupPredefinedEntityValue';
import { setupReferencedEntity } from './setupReferencedEntity';
import { GeneralEntityInfo } from './EntityDetails';

type ExpandAttrResult = {
   newValue: AttributeValuePToken;
   errors: Array<XmlError>;
};
type AttrExpanded = (result: ExpandAttrResult) => void;

type ParseResults = {
   attFragment: AttributeValuePToken | void;
   preparseValue: EntityValuePToken | void;
   errors: Array<XmlError>;
};

/*
 * Finally, given a definitely populated geInfo.valueCache, parse the resulting
 * text as an attribute value, recursively expand it, and call back with
 * the results
 * */
function parseEntityValue(
   geInfo: GeneralEntityInfo,
   expandParams: ExpandParams,
   geRefChain: Array<string>,
   errors: Array<XmlError>,
   callback: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(geInfo.token.name);
   const entityValue = geInfo.valueCache;
   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
   const sTokenSource: STokenSource = entityValueToSTokenSource(entityValue!, expandParams.emd);

   expandParams.utils.parseAttributeValue(sTokenSource, (attrValue, newErrors) => {
      // If it still didn't parse into anything useful, abort.
      if (!attrValue) {
         callback({
            attFragment: undefined,
            preparseValue: entityValue,
            errors: errors.concat(newErrors),
         });
         return;
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      expandAttrInternal(attrValue, expandParams, geRefChain.concat(entityName), (result) => {
         const { newValue, errors: moreErrors } = result;
         callback({
            attFragment: newValue,
            preparseValue: entityValue,
            errors: errors.concat(newErrors, moreErrors),
         });
      });
   });
}

/*
 * Perfrom several basic santity checks on the general entity reference we want
 * to expand, returning appropriate results if needed. If those checks pass,
 * defer to another routine to set up and process the entity value.
 */
function expandGeRef(
   expandParams: ExpandParams,
   geRefChain: Array<string>,
   geRef: GeneralEntityReferencePToken,
   callback: (result: ParseResults) => void,
): void {
   const entityName = strOrBlank(geRef.name);
   const geInfo = expandParams.entityDetails.getGeDetails(entityName);

   // Stop processing if we find this entity reference is already being processed
   if (entityName !== '' && geRefChain.includes(entityName)) {
      callback({
         attFragment: undefined,
         preparseValue: undefined,
         errors: [],
      });
      return;
   }

   // If there is no declaration, check if it is one of the predefined entities.
   // return nothing or the predefined value
   if (!geInfo) {
      const predefinedValue = lookupPredefinedEntityValue(entityName);
      const castPredefined = predefinedValue as AttributeValuePToken | void;

      callback({
         attFragment: castPredefined,
         preparseValue: predefinedValue,
         errors: [],
      });

      return;
   }

   // If it is an unparsed entity, also abort
   if (geInfo.isUnparsed) {
      callback({
         attFragment: undefined,
         preparseValue: undefined,
         errors: [],
      });

      return;
   }

   const localRefChain = [...geRefChain, entityName];

   if (geInfo.valueCache) {
      parseEntityValue(geInfo, expandParams, localRefChain, [], callback);
      return;
   }

   // No valueCache, so try to load it.
   setupReferencedEntity(geRef, expandParams, (newErrors) => {
      const entityValue = geInfo.valueCache;

      // If we still have to valueCache, something is amiss. Abort.
      if (!entityValue) {
         callback({
            attFragment: undefined,
            preparseValue: undefined,
            errors: newErrors,
         });
         return;
      }

      parseEntityValue(geInfo, expandParams, localRefChain, newErrors, callback);
   });
}

/*
 * This does the "outer" work of the expansion process. We
 * identify the general entity references in the attribute value
 * and then call another routine to expand each of those.
 * We then stitch the attribute value back together replacing
 * each general entity reference with its expanded contents.
 */
function expandAttrInternal(
   attValue: AttributeValuePToken,
   expandParams: ExpandParams,
   geRefChain: Array<string>,
   expanded: AttrExpanded,
): void {
   const geRefs: Array<GeneralEntityReferencePToken> = [];

   for (const element of attValue) {
      if (element.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         geRefs.push(element);
      }
   }

   if (geRefs.length === 0) {
      expanded({ newValue: attValue, errors: [] });
      return;
   }

   const expandRef = expandGeRef.bind(undefined, expandParams, geRefChain);

   // Process expand all the geRefs potentially very asynchronously.
   doAsyncLoop(geRefs, expandRef, (results) => {
      const allErrors: Array<XmlError> = [];
      const newValue: AttributeValuePToken = [];
      let geRefIndex = 0;

      // Now stitch the original attribute value together with expansions
      for (const element of attValue) {
         if (element.type !== GENERAL_ENTITY_REFERENCE_PTOKEN) {
            newValue.push(element);
            continue;
         }

         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         const { attFragment, preparseValue, errors } = results[geRefIndex];

         geRefIndex++;
         allErrors.push(...errors);

         if (!attFragment) {
            // For some reason couldn't expand. Just put it in the array
            newValue.push(element);
         } else {
            // expanded! wrap the expanded contents with a start and end
            newValue.push(
               new GeneralEntityStartPToken(element, preparseValue),
               ...attFragment,
               new GeneralEntityEndPToken(element, preparseValue),
            );
         }
      }

      expanded({ newValue, errors: allErrors });
   });
}

/*
 * This takes an AttributeValuePToken and expands all General Entity References and
 * character references in it, and returns a new one with all the expanded values.
 *
 * Entity processing is, for better or worse, the bane of dealing with XML. It is
 * made more complex by this project's decision to separate different kinds of
 * processing into different stages in a pipeline.  So, it is worth walking
 * through this in excruciating detail, both for you, dear reader, as well as
 * my own future self.
 *
 * First, the input AttributeValuePToken can only contain Text, CharRefs and GE Refs
 * in it (if, for some reason, an attribute value was passed through twice, then it
 * could also have GE Start and GE Ends, which does not significantly change the
 * algorithm here). Note that this AttributeValuePToken could be from the attribute
 * on an ElementStart or EmptyElement, or a default value in an ATTLIST attribute
 * declaration.
 *
 * The goal of this routine is to replace any GE References with a GE Start, the
 * contents of the corresponding GE declaration value, and a GE End. Since
 * this is part of the expansion stage in the pipeline, this does no error
 * reporting, but instead leaves enough information in the PTokens for other
 * stages in the pipeline to report fully.  The description below notes
 * where the error reporting should happen.
 *
 * First, of course, the GE Reference may not have a corresponding declaration.
 * In this case, this routine leaves the GE Reference in the AttributeValuePToken.
 * THis will generate well formed and/or validity errors in other stages
 *
 * Second, the GE Reference may reference an unparsed entity, which is illegal.
 * In this case we leave the GE Reference in the new AttributeValuePToken.
 * Other stages wil report an error
 *
 * Third, and "most" puzzling, the entity may refer to a value-external entity,
 * which is not allowed (this should not be confused with an externally declared
 * entity, which is fine). In this case, we will try to retrieve the value
 * anyway and insert the value. Other stages will report errors.
 *
 * Fourth, as noted below, we may be in the middle of a recursive call
 * to this routine, and we may find that we're about to start parsing a
 * GE Ref which we're in the middle of parsing higher up in the stack.
 * In this case we will simply leave the GERef in the results.
 *
 * Once we've found the entity, we then retrieve the EntityValuePToken from
 * another routine. We pass it enough information that it will not just return
 * the EntityValuePToken for that entity, but if necessary retrieve and insert
 * all parameter entities referenced from that General Entity declaration
 * value. Those parameter entities may, themselves, refer to other parameter
 * entities. That routine will try to accumulate all of these into
 * the EntityValuePToken it returns. It may encounter value-external entities
 * as well as recursive references to parameter entities, or simply missing
 * declarations. Value-external entities will nevertheless be inserted into
 * this if possible, while recursive entries and missing declarations will
 * leave the reference token in place.
 *
 * Once this gets the EntityValuePToken back, it then does several things
 * - First, will store the unparsed data in the GE Start token that it
 *   creates, so other routines can examine the PTokens and report on the
 *   errors above.
 * - Second, this will parse those results into a set of values that make up
 *   a "sub" AttributeValuePToken. This is because the text in the
 *   EntityValuePToken may, itself, include general entity references
 *   and character references in it in their text form. This will then
 *   recursively call itself with the resulting AttributeValuePToken
 *   (which, if you are following, will then process any GE Refs and
 *   store the parsed values ad infinitum)
 *
 * Once this whole process is done, what comes back will be Text tokens,
 * CharRef tokens, potentially GE Ref tokens, and arbitrarily-deep nesting
 * of GE Start and GE End pairs with text, charref in them. All signs of
 * any earlier parameter entities will have been lost here.
 *
 * Below are the portions of the standard which apply to attribute
 * processing, but which we do not report on.
 *
 * §4.1.0: Well-formedness constraint: Entity Declared
 *    In a document without any DTD, a document with only an internal DTD subset which
 *    contains no parameter entity references, or a document with " standalone='yes' ",
 *    for an entity reference that does not occur within the external subset or a
 *    parameter entity, the Name given in the entity reference must match that in
 *    an entity declaration that does not occur within the external subset or
 *    a parameter entity, except that well-formed documents need not declare any of
 *    the following entities: amp, lt, gt, apos, quot.  The declaration of a general
 *    entity must precede any reference to it which appears in a default value in
 *    an attribute-list declaration.
 *    Note that non-validating processors are not obligated to read and process
 *    entity declarations occurring in parameter entities or in the external subset;
 *    for such documents, the rule that an entity must be declared is a well-formedness
 *    constraint only if standalone='yes'.
 *
 * §4.1.0: Well-Formedness Constraint: Parsed Entity
 *     An entity reference must not contain the name of an unparsed entity.
 *     Unparsed entities may be referred to only in attribute values
 *     declared to be of type ENTITY or ENTITIES.
 *
 * §3.1.0: Well-Formedness Constraint: No External Entity References
 *     Attribute values must not contain direct or indirect entity
 *     references to external entities.
 *
 * §4.1.0 Well-formedness constraint: No Recursion
 *     A parsed entity must not contain a recursive reference to itself,
 *     either directly or indirectly.
 *
 * §3.1.0 Well-formedness constraint: No < in Attribute Values
 *     The replacement text of any entity referred to directly or indirectly
 *     in an attribute value must not contain a <.
 */
function expandAttributeValue(
   value: AttributeValuePToken,
   expandParams: ExpandParams,
   expanded: AttrExpanded,
): void {
   expandAttrInternal(value, expandParams, [], expanded);
}

export { expandAttributeValue, AttrExpanded, ExpandAttrResult };
