/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ENTITY_META_DATA, EntityKind, EntityLocation, EntityMetaData } from 'basic';
import { strOrBlank } from 'sToken';
import {
   ATTLISTDECL_PTOKEN_TYPE,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   AttListPToken,
   AttributeValuePToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   GeneralEntityDeclarationPToken,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   PToken,
} from 'token';

import { EntityProcessors, ExpandParams } from './types';

import { doAsyncLoop } from './utils/doAsyncLoop';
import { expandBodyReference } from './utils/expandBodyReference';
import { expandAttributeValue, AttrExpanded, ExpandAttrResult } from './utils/expandAttributeValue';

type DeclToken =
   | AttListPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken;

type TokenExpanded = () => void;
type DeliverPToken = (token: PToken) => void;

enum State {
   AT_START,
   IN_INTERNAL_SUBSET,
   IN_EXTERNAL_SUBSET,
   IN_CONTENT,
}

/**********************************************************************\
 An EntityExpander transforms a series of PTokens by replacing any
 general or parameter entity reference tokens it receives (either
 as tokens directly received, or embedded within entity declaration
 values, attribute declaration list default values, other within
 markup declarations, or in attribute values) with a series of
 tokens from the corresponding entity values.

 Philosophically, this sees itself as a neutral proessing stage in
 the overall pipeline of XML document handling. That is, it does
 not do any well formed or validation checks. However, for reasons
 discussed below, to make this stance work, it will introduce
 certain new tokens into the stream that are essentially metadata
 for well formed or validation checks later on. Because it may
 try to load external entities, and those loading processes may
 fail, this may introduce some XML Error's into the stream.

 EXPANSION

 Entity expansion is the heart of what makes full XML conformance
 a challenge. The rules around handling entities are surprisingly
 nuanced, and their combination can lead to some real complexities.
 It takes many reads of the specification to knit together the
 full picture, and this author has at times turned to xmllint
 on MacOS to verify some subtle details.


 ARCHITECTURE

 This class, like the rest of this project, is deliberately built
 to be neutral to how PTokens are delivered to it. Like the rest of
 the system, this could be harnessed into something using node.js
 strems to obtain and deliver tokens, or it could be ultimately
 living in a browser with a different mechamism. Like the rest of
 the system, this simply recieves tokens and uses a callback
 scheme to signal that it is done processing that. This does not
 use promises both because the system didn't use promises when it
 was started, and because some experiments have shown that promises
 can significantly drag the performance down since it requires a full
 event loop cycle to get back to the work, and given the
 "size" of the data flowing through this that can degrade performance
 significantly. The downside to this is one must be sensitive to the
 stack size that could emerge.

>> Should the internal and external subset tokens be being created here, or in the ptoken stream?


 Expand here means that the entity reference is replaced by an entity
 start PToken, followed by the PTokens that are derived from the
 entity value, followed by an entity end PToken.

 This behavior is specified across several sections of the standard,
 including §2.8, §2.9, §4.1 and §5.1.

 This does minimal checking on the overall well-formedness or validity
 of the series of PTokens. Indeed, this will readily expand things
 that are not well-formed or not valid (e.g. this will expand
 parameter entity references in markup declarations in the internal
 subset), relying on other proceses to dect and flag these violations.

 This does enforce a few constraints:
 1) From §5.1: When in non-validating mode, this will not load any
    external entities, including the external subset.
 2) From §5.1: In non-validating/standalone=no mode, this will stop
    "reading" any entity or attlist declarations encountered after
    a parameter entity reference in the DTD.
 3) From §3.1: This does not expand references to external entities
    in attribute values.
 4) From §2.9: This will not expand any parameter entities in the
    internal DTD in non-validating or standalone mode.

 Note: It is important to note that within-markup declarations may
 not be fully expanded, especially when the validation mode is
 NON-VALIDATING. Of course, any other entity reference (in the DTD,
 in content, in an attribute or entity value) may not have been
 expanded for one reason or another (e.g. there is no declaration,
 or this is non-validating), but those are probably less surprising.
\**********************************************************************/

class EntityExpander {
   private deliverToken: DeliverPToken;
   private expandParams: ExpandParams;
   private loadExternalEntities: boolean;
   private state = State.AT_START;

   constructor(validating: boolean, handoffToken: DeliverPToken, processors: EntityProcessors) {
      this.deliverToken = handoffToken;
      this.expandParams = {
         peDeclCache: {},
         geDeclCache: {},
         utils: processors,
         emd: new EntityMetaData(
            EntityKind.DOCUMENT,
            1.0,
            5,
            new EntityLocation('dummy meta data to keep TypeScript happy'),
         ),
      };
      this.loadExternalEntities = validating;
   }

   public expandToken(pToken: PToken, expanded: TokenExpanded): void {
      switch (pToken.type) {
         case ENTITY_META_DATA:
            this.expandParams.emd = pToken;
            this.deliverToken(pToken);
            expanded();
            break;
         case DOCTYPE_START_PTOKEN:
            this.handleDocTypeStart(pToken as DocTypeStartPToken, expanded);
            break;
         case DOCTYPE_END_PTOKEN:
            this.handleDocTypeEnd(pToken as DocTypeEndPToken, expanded);
            break;
         case ATTLISTDECL_PTOKEN_TYPE:
         case ELEMENT_DECLARATION_PTOKEN:
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
            this.handleDeclaration(pToken, expanded);
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            this.handleElementStart(pToken, expanded);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            // this.handleGeneralEntityReference(pToken as GeneralEntityReferencePToken, expanded);
            break;
         // case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         //    this.handleParameterEntityReference(pToken as ParameterEntityReferencePToken, expanded);
         //    break;
         default:
            this.deliverToken(pToken);
            expanded();
      }
   }

   private handleDeclaration(declarationPToken: DeclToken, expanded: TokenExpanded): void {
      // REFACTOR/CLEANUP: Lookes like unassigned should never be undefined
      if (!declarationPToken.unassigned || declarationPToken.unassigned.length === 0) {
         this.processExpandedDeclaration(declarationPToken, expanded);
         return;
      }

      // this.expandUnassigned(pToken.unassigned, true, (newUnassigned) => {
      //    pToken.unassigned = newUnassigned as any;
      //    assignUnassigned(pToken);
      //    this.processExpandedDeclaration(declarationPToken, expanded);
      // });
   }

   private processExpandedDeclaration(declarationPToken: DeclToken, expanded: TokenExpanded): void {
      switch (declarationPToken.type) {
         case ELEMENT_DECLARATION_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
            this.deliverToken(declarationPToken);
            expanded();
            break;
         case ATTLISTDECL_PTOKEN_TYPE:
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            // Temp hack to make start and end elements work
            const name = strOrBlank(declarationPToken.name);
            this.expandParams.geDeclCache[name] = {
               token: declarationPToken,
               isUnparsed: false,
               isInternal: true,
               valueCache: declarationPToken.value as any, // REFACTOR Type is bad in generaldeclarationentity
            };
            this.deliverToken(declarationPToken);
            expanded();
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            break;
      }
   }

   /*
    * The <!DOCTYPE> declaration carries information about whether there is an
    * internal DTD subset, and whether and where there is an external DTD subset.
    * Use this information to introduce an internal subset start token,
    * if appropriate, and use this to leave enough information to later
    * do the external subset processing.
    *
    * Because of the way PTokens are built, the start and end of the
    * DOCTYPE declaration come in different tokens, since the internal subset
    * tokens will come between.
    *
    * Declaration: §2.8.0 [28]
    */
   private handleDocTypeStart(pToken: DocTypeStartPToken, handled: TokenExpanded): void {
      this.deliverToken(pToken);

      if (pToken.openSubset) {
         this.state = State.IN_INTERNAL_SUBSET;
         this.deliverToken(new InternalSubsetStartToken());
      }

      if (pToken.externalId && this.loadExternalEntities) {
         this.expandParams.externalSubset = {
            type: 'EXTERNAL_SUBSET',
            externalId: pToken.externalId,
         };
      }

      handled();
   }

   /*
    * When we reach the end of the DOCTYPE declaration, we've finished
    * the interal subset, if any. If there is an external subset,
    * introduce pseudo PTokens for the start and end, and retrieve the
    * contents and place between them. Notably, the external subset could
    * arbitrarily large, so as each token is parsed from it, we feed
    * it back through this exact same class instance to do any expansion
    * of tokens that occur within that.  This makes the head explode
    * a bit with this recursive call to this class while in the middle
    * of a callback from a subroutine.
    *
    * Declaration: §2.8.0 [28]
    */
   private handleDocTypeEnd(pToken: DocTypeEndPToken, handled: TokenExpanded): void {
      if (this.state === State.IN_INTERNAL_SUBSET) {
         this.deliverToken(new InternalSubsetEndToken());
      }

      const externalSubsetToken = this.expandParams.externalSubset;

      if (!externalSubsetToken) {
         this.state = State.IN_CONTENT;
         this.deliverToken(pToken);
         handled();
         return;
      }

      this.state = State.IN_EXTERNAL_SUBSET;
      this.deliverToken(new ExternalSubsetStartToken());

      expandBodyReference(externalSubsetToken, this.expandParams, (result, done) => {
         if (result) {
            this.expandToken(result, done);
            return;
         }
         this.deliverToken(new ExternalSubsetEndToken());
         this.state = State.IN_CONTENT;
         this.deliverToken(pToken);
         done(); // acknowledge we are done with the callback from expandBodyReference()
         handled(); // and mark the end of processing of the DOCTYPE end token
      });
   }

   private handleElementStart(
      pToken: ElementStartPToken | ElementEmptyPToken,
      handled: TokenExpanded,
   ): void {
      const expandParams = this.expandParams;

      if (pToken.attributes.length === 0) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      const attributeValues: Array<AttributeValuePToken> = pToken.attributes.map(
         (attribute) => attribute.value,
      ) as any; // REFACTOR/CLEANUP: Lookes like unassigned should never be undefined

      function process(attributeValue: AttributeValuePToken, callback: AttrExpanded): void {
         expandAttributeValue(attributeValue, expandParams, callback);
      }

      const reassign = (results: Array<ExpandAttrResult>): void => {
         const allErrors = [];
         let index = 0;

         for (const result of results) {
            for (const err of result.errors) {
               this.deliverToken(err);
            }
            allErrors.push(...result.errors);
            pToken.attributes[index].value = result.newValue as any; // REFACTOR/CLEANUP: Attribute values in AttributePToken is not the right type
            index++;
         }

         this.deliverToken(pToken);
         handled();
      };

      doAsyncLoop(attributeValues, process, reassign);
   }
}

export { EntityExpander };
