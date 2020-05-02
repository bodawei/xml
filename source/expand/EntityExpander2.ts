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
            this.handleAttListDeclaration(declarationPToken, expanded);
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            // Temp hack to make start and end elements work
            // const name = strOrBlank(declarationPToken.name);
            // this.expandParams.geDeclCache[name] = {
            //    token: declarationPToken,
            //    isUnparsed: false,
            //    isInternal: true,
            //    valueCache: declarationPToken.value as any, // REFACTOR Type is bad in generaldeclarationentity
            // };
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

   /*
    * For element start and empty tokens, we simply need to expand any general
    * entity references that appear in their attributes.
    */
   private handleElementStart(
      pToken: ElementStartPToken | ElementEmptyPToken,
      handled: TokenExpanded,
   ): void {
      const attributeValues: Array<AttributeValuePToken> = [];

      if (pToken.attributes.length === 0) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      const process = (attributeValue: AttributeValuePToken, callback: AttrExpanded): void => {
         expandAttributeValue(attributeValue, this.expandParams, callback);
      };

      const reassign = (results: Array<ExpandAttrResult>): void => {
         for (let index = 0; index < results.length; index++) {
            for (const err of results[index].errors) {
               this.deliverToken(err);
            }
            pToken.attributes[index].value = results[index].newValue as any; // REFACTOR/CLEANUP: Attribute values in AttributePToken is not the right type
         }

         this.deliverToken(pToken);
         handled();
      };

      for (const attribute of pToken.attributes) {
         attributeValues.push(attribute.value as any); // REFACTOR/CLEANUP: Lookes like unassigned should never be undefined
      }

      doAsyncLoop(attributeValues, process, reassign);
   }

   private handleAttListDeclaration(pToken: AttListPToken, handled: TokenExpanded): void {
      const attributeValues: Array<AttributeValuePToken> = [];

      const process = (attributeValue: AttributeValuePToken, callback: AttrExpanded): void => {
         expandAttributeValue(attributeValue, this.expandParams, callback);
      };

      const reassign = (results: Array<ExpandAttrResult>): void => {
         for (let index = 0; index < results.length; index++) {
            for (const err of results[index].errors) {
               this.deliverToken(err);
            }

            pToken.attDefs[index].value = results[index].newValue as any; // REFACTOR/CLEANUP: Attribute values in AttributePToken is not the right type
         }

         this.deliverToken(pToken);
         handled();
      };

      for (const def of pToken.attDefs) {
         attributeValues.push(def.value as any); // REFACTOR/CLEANUP: Lookes like unassigned should never be undefined
      }

      doAsyncLoop(attributeValues, process, reassign);
   }
}

export { EntityExpander };
