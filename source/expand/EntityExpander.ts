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
   EntityValuePToken,
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
   attListDeclaration,
   assignElementDeclarationUnassigned,
} from 'token';

import { expandAttributes } from './utils/expandAttributes';
import { expandEntityValue } from './utils/expandEntityValue';
import { expandUnassigned } from './utils/expandUnassigned';
import { ExternalDtdSubsetPseudoToken } from './utils/ExternalDtdSubsetPseudoToken';
import { streamEntityReference } from './utils/streamEntityReference';

import { EntityProcessors, ExpandParams } from './types';
import { EntityDetails } from './utils/EntityDetails';

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
 call the expanded() callback when it is done expanding that.

 The caller should not call expandPToken() until the expanded() callback
 has been invoked.  Thus, it is the responsibility of the caller to
 manage flow control.

 This will introduce an InternalSubsetStartToken, and an
 InternalSubsetEndToken before and after the internal subset (only if
 it exists) as well as an ExternalSubsetStart/EndToken around the
 external subset.

 If validating, passed to the constructor, is false, this will not
 load external entities.
\**********************************************************************/

class EntityExpander {
   private deliverToken: DeliverPToken;
   private expandParams: ExpandParams;
   private loadExternalEntities: boolean;
   private state = State.AT_START;

   constructor(validating: boolean, handoffToken: DeliverPToken, processors: EntityProcessors) {
      this.deliverToken = handoffToken;
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
         this.expandParams.externalSubset = new ExternalDtdSubsetPseudoToken(pToken.externalId);
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
   private handleDocTypeEnd(pToken: DocTypeEndPToken, handled: PTokenExpanded): void {
      if (this.state === State.IN_INTERNAL_SUBSET) {
         this.deliverToken(new InternalSubsetEndToken());
      }

      const externalSubsetToken = this.expandParams.externalSubset;

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

   private handleDeclaration(declarationPToken: DeclToken, handled: PTokenExpanded): void {
      // UNASSIGNED REFACTOR/CLEANUP: Lookes like unassigned should never be undefined
      if (!declarationPToken.unassigned || declarationPToken.unassigned.length === 0) {
         this.processExpandedDeclaration(declarationPToken, handled);
         return;
      }

      expandUnassigned(declarationPToken.unassigned, this.expandParams, (results) => {
         // UNASSIGNED REFACTOR/CLEANUP: We should not be assigning back to unassigned
         (declarationPToken.unassigned as any) = results.newValue;

         switch (declarationPToken.type) {
            case ELEMENT_DECLARATION_PTOKEN:
               assignElementDeclarationUnassigned(declarationPToken);
               break;
            case NOTATION_DECLARATION_PTOKEN:
               declarationPToken.assignUnassigned();
               break;
            case ATTLISTDECL_PTOKEN_TYPE:
               attListDeclaration.assignUnassigned(declarationPToken);
               break;
            case GENERAL_ENTITY_DECLARATION_PTOKEN:
            case PARAMETER_ENTITY_DECLARATION_PTOKEN:
               declarationPToken.assignUnassigned();
               break;
         }

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
    * Processing an entity declaration involves two steps:
    * Setting up a cache entry for it, but not yet "installing" that
    * entry.
    * If it is a value-internal entity, then we expand its value and
    * add that to the cache entry.
    *
    * Note that we do not actually set up the cache entry until the
    * value has been expanded (if it is going to be), so that it is not
    * possible to have the entity refer to itself.
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
      expandEntityValue(
         pToken.value as any,
         this.expandParams,
         (newValue: EntityValuePToken, errors: Array<XmlError>): void => {
            // Store the cache entry in the overall cache only when we are done
            // doing all value processing. This prevents recursive uses of the declaration.
            this.expandParams.entityDetails.addEntity(pToken, newValue);

            this.deliverErrors(errors);
            this.deliverToken(pToken);
            handled();
         },
      );
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
