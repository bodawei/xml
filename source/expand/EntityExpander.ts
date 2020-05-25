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
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   AttListPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   PToken,
   XmlError,
} from 'token';

import { EntityDetails } from './utils/EntityDetails';
import { expandAttributes } from './utils/expandAttributes';
import { expandEntityValue } from './utils/expandEntityValue';
import { expandUnassigned } from './utils/expandUnassigned';
import { ExternalDtdSubsetPseudoToken } from './utils/ExternalDtdSubsetPseudoToken';
import { streamEntityReference } from './utils/streamEntityReference';
import { EntityProcessors, ExpandParams } from './types';

type DeclToken =
   | AttListPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken;

type PTokenExpanded = () => void;
type DeliverPToken = (token: PToken) => void;

enum State {
   AT_START,
   IN_INTERNAL_SUBSET,
   IN_EXTERNAL_SUBSET,
   IN_CONTENT,
}

/**********************************************************************\
 This is the entrypoint to entity expanding. it has semantics similar
 to a node.js stream: hand it a token to be expanded, and it will
 call the expanded() callback when it is done expanding it.

 The caller should not call expandPToken() until the expanded() callback
 has been invoked.  Thus, it is the responsibility of the caller to
 buffer any values that arrive on its doorstep before this has
 called the callback.

 This will introduce an InternalSubsetStartToken, and an
 InternalSubsetEndToken before and after the internal subset (only if
 it exists) as well as an ExternalSubsetStart/EndToken around the
 external subset.

 If validating (passed to the constructor) is false, this will not
 load external entities.
\**********************************************************************/

class EntityExpander {
   private deliverToken: DeliverPToken;
   private expandParams: ExpandParams;
   private loadExternalEntities: boolean;
   private state = State.AT_START;

   constructor(validating: boolean, deliverPToken: DeliverPToken, processors: EntityProcessors) {
      this.deliverToken = deliverPToken;
      this.expandParams = {
         entityDetails: new EntityDetails(),
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

   public expandPToken(pToken: PToken, expanded: PTokenExpanded): void {
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
            this.handleDocTypeEnd(pToken, expanded);
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
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.handleEntityReference(pToken, expanded);
            break;
         default:
            this.deliverToken(pToken);
            expanded();
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
   private handleDocTypeStart(pToken: DocTypeStartPToken, handled: PTokenExpanded): void {
      this.deliverToken(pToken);

      if (pToken.openSubset) {
         this.state = State.IN_INTERNAL_SUBSET;
         this.deliverToken(new InternalSubsetStartToken());
      }

      if (pToken.externalId) {
         this.expandParams.entityDetails.addExternalSubset(pToken.externalId);
      }

      handled();
   }

   /*
    * When we reach the end of the DOCTYPE declaration, we've finished
    * the interal subset, if any. So, send the end token if we were
    * delivering an internal subset. If there is an external subset,
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
   private handleDocTypeEnd(pToken: DocTypeEndPToken, handled: PTokenExpanded): void {
      if (this.state === State.IN_INTERNAL_SUBSET) {
         this.deliverToken(new InternalSubsetEndToken());
      }

      const externalSubsetToken = this.expandParams.entityDetails.getExternalSubsetReference();

      if (!externalSubsetToken || !this.loadExternalEntities) {
         this.state = State.IN_CONTENT;
         this.deliverToken(pToken);
         handled();
         return;
      }

      this.state = State.IN_EXTERNAL_SUBSET;
      this.deliverToken(new ExternalSubsetStartToken());

      streamEntityReference(externalSubsetToken, this.expandParams, (result, nextPTokenDone) => {
         if (result) {
            this.expandPToken(result, nextPTokenDone);
            return;
         }

         this.deliverToken(new ExternalSubsetEndToken());
         this.state = State.IN_CONTENT;
         this.deliverToken(pToken);
         nextPTokenDone(); // acknowledge we are done with the callback from expandBodyReference()
         handled(); // and mark the end of processing of the DOCTYPE end token
      });
   }

   /*
    * Declarations can have parameter entity references within them.
    *    e.g. <!NOTATION %moreDetails;>
    * if that happens, we must first expand that parameter entity reference
    * and construct the full declaration token using the data from that
    * parameter entity before we can actually process the declaration.
    */
   private handleDeclaration(declarationPToken: DeclToken, handled: PTokenExpanded): void {
      // UNASSIGNED REFACTOR/CLEANUP: Lookes like unassigned should never be undefined
      if (!declarationPToken.unassigned || declarationPToken.unassigned.length === 0) {
         this.processExpandedDeclaration(declarationPToken, handled);
         return;
      }

      expandUnassigned(declarationPToken.unassigned, this.expandParams, (results) => {
         // UNASSIGNED REFACTOR/CLEANUP: We should not be assigning back to unassigned
         (declarationPToken.unassigned as any) = results.newValue;

         declarationPToken.assignUnassigned();

         this.deliverErrors(results.errors);
         this.processExpandedDeclaration(declarationPToken, handled);
      });
   }

   /*
    * With any unassigned values in the declaration expanded, we can now proceed with
    * doing any further expansion of parameter entities in the declarations.
    */
   private processExpandedDeclaration(
      declarationPToken: DeclToken,
      expanded: PTokenExpanded,
   ): void {
      switch (declarationPToken.type) {
         case ELEMENT_DECLARATION_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
            // Nothing more needs to be done for these
            this.deliverToken(declarationPToken);
            expanded();
            break;
         case ATTLISTDECL_PTOKEN_TYPE:
            this.handleAttListDeclaration(declarationPToken, expanded);
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(declarationPToken, expanded);
            break;
      }
   }

   /*
    * For ATTLIST tokens, the default values need to be expanded at declaration time,
    * not at use (which is a bit of a surprise).
    *
    * §4.1.0 Well-formedness constraint: Entity Declared
    *    The declaration of a general entity must precede any reference to it which
    *    appears in a default value in an attribute-list declaration.
    */
   private handleAttListDeclaration(pToken: AttListPToken, handled: PTokenExpanded): void {
      // REFACTOR/CLEANUP: default type is wrong.
      expandAttributes(pToken.attDefs as any, this.expandParams, (results) => {
         for (let index = 0; index < results.length; index++) {
            pToken.attDefs[index].value = results[index].newValue; // REFACTOR/CLEANUP: We probably can't actually modify the object directly
            this.deliverErrors(results[index].errors);
         }

         this.deliverToken(pToken);
         handled();
      });
   }

   /*
    * Processing an entity declaration involves several considerations:
    * - If an entity is declared multiple times, only the first is honored (§4.2.0)
    * - If the entity value is external, then we proceed, without loading or
    *   examining its value at this time.
    * - If it is internal, we will expand its value immediately.
    *   Note that we store the expanded value for later use.
    *
    * This IS a possible risk to the overall goal of being able to process
    * arbitrarily large documents, since it is conceivable that the expanded
    * entity would be gigabytes in size. Thus, it is easy to see that this
    * might eventually be implemented in a way to verify that the full
    * tree of parameter entities are syntactically well formed, while not
    * storing the value.
    */
   private handleEntityDeclaration(
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
      handled: PTokenExpanded,
   ): void {
      const name = strOrBlank(pToken.name);
      const hasEntry = this.expandParams.entityDetails.hasEntity(pToken);

      if (name === '' || hasEntry) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      if (pToken.externalId) {
         this.expandParams.entityDetails.addEntity(pToken);
         this.deliverToken(pToken);
         handled();
         return;
      }

      // REFACTOR/CLEANUP again types do not match correctly
      expandEntityValue(pToken.value as any, this.expandParams, (result): void => {
         this.expandParams.entityDetails.addEntity(pToken, result.newValue);

         this.deliverErrors(result.errors);
         this.deliverToken(pToken);
         handled();
      });
   }

   /*
    * For element start and empty tokens, we simply need to expand any general
    * entity references that appear in their attributes.
    */
   private handleElementStart(
      pToken: ElementStartPToken | ElementEmptyPToken,
      handled: PTokenExpanded,
   ): void {
      // Optimize for a common case of having no attributes
      if (pToken.attributes.length === 0) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      // REFACTOR/CLEANUP: default type is wrong.
      expandAttributes(pToken.attributes as any, this.expandParams, (results) => {
         for (let index = 0; index < results.length; index++) {
            pToken.attributes[index].value = results[index].newValue; // REFACTOR/CLEANUP: We probably can't actually modify the object directly
            this.deliverErrors(results[index].errors);
         }

         this.deliverToken(pToken);
         handled();
      });
   }

   handleEntityReference(
      pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken,
      handled: PTokenExpanded,
   ): void {
      let start: GeneralEntityStartPToken | ParameterEntityStartPToken;
      let end: GeneralEntityEndPToken | ParameterEntityEndPToken;
      let seenOneResult = false;

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         start = new GeneralEntityStartPToken(pToken);
         end = new GeneralEntityEndPToken(pToken);
      } else {
         start = new ParameterEntityStartPToken(pToken);
         end = new ParameterEntityEndPToken(pToken);
      }

      streamEntityReference(pToken, this.expandParams, (result, done) => {
         // how do you distinguish a failure to lookup vs. an empty one?
         if (!result) {
            this.deliverToken(end);
            handled();
         } else {
            if (!seenOneResult) {
               this.deliverToken(start);
               seenOneResult = true;
            }

            this.expandPToken(result, done);
         }
      });
   }

   private deliverErrors(errors: Array<XmlError>): void {
      for (const err of errors) {
         this.deliverToken(err);
      }
   }
}

export { EntityExpander };
