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
   AttributeValuePToken,
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
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   PToken,
   XmlError,
   GeneralEntityStartPToken,
} from 'token';

import { EntityProcessors, ExpandParams, GeneralEntityInfo, ParameterEntityInfo } from './types';

import { doAsyncLoop } from './utils/doAsyncLoop';
import { expandAttributeValue, AttrExpanded, ExpandAttrResult } from './utils/expandAttributeValue';
import { expandEntityValue } from './utils/expandEntityValue';
import { ExternalDtdSubsetPseudoToken } from './utils/ExternalDtdSubsetPseudoToken';
import { LoadingEmitter } from './utils/LoadingEmitter';
import { streamEntityReference } from './utils/streamEntityReference';

type DeclToken =
   | AttListPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken;
type AttrValueObj = { value: AttributeValuePToken };

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
            // Might want to hold off in case we can not find the entity
            if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
               this.deliverToken(new GeneralEntityStartPToken(pToken));
            } else {
               this.deliverToken(new ParameterEntityStartPToken(pToken));
            }
            streamEntityReference(pToken, this.expandParams, (result, handled) => {
               if (!result) {
                  if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
                     this.deliverToken(new GeneralEntityEndPToken(pToken));
                  } else {
                     this.deliverToken(new ParameterEntityEndPToken(pToken));
                  }
                  expanded();
               } else {
                  this.expandToken(result, handled);
               }
            });
            break;
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
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(declarationPToken, expanded);
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

      streamEntityReference(externalSubsetToken, this.expandParams, (result, done) => {
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
      // Optimize for a common case of having no attributes
      if (pToken.attributes.length === 0) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      // REFACTOR/CLEANUP: default type is wrong.
      this.expandAttributeValueObjects(pToken.attributes as any, (results) => {
         for (let index = 0; index < results.length; index++) {
            pToken.attributes[index].value = results[index]; // REFACTOR/CLEANUP: We probably can't actually modify the object directly
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
   private handleAttListDeclaration(pToken: AttListPToken, handled: TokenExpanded): void {
      // REFACTOR/CLEANUP: default type is wrong.
      this.expandAttributeValueObjects(pToken.attDefs as any, (results) => {
         for (let index = 0; index < results.length; index++) {
            pToken.attDefs[index].value = results[index]; // REFACTOR/CLEANUP: We probably can't actually modify the object directly
         }

         this.deliverToken(pToken);
         handled();
      });
   }

   /*
    * Given either a set of attributes, or a set of attribute definition, extract
    * each of the values and expand any general entity references in them.
    * deliver any errors into the output stream, and return the modified values
    * back to the caller.
    */
   private expandAttributeValueObjects(
      valueObjects: Array<AttrValueObj>,
      expanded: (resuts: Array<AttributeValuePToken>) => void,
   ): void {
      const attributeValues: Array<AttributeValuePToken> = [];

      for (const valueObj of valueObjects) {
         attributeValues.push(valueObj.value);
      }

      const process = (attributeValue: AttributeValuePToken, callback: AttrExpanded): void => {
         expandAttributeValue(attributeValue, this.expandParams, callback);
      };

      const reassign = (results: Array<ExpandAttrResult>): void => {
         const newValues: Array<AttributeValuePToken> = [];

         for (let index = 0; index < results.length; index++) {
            for (const err of results[index].errors) {
               this.deliverToken(err);
            }

            newValues.push(results[index].newValue);
         }

         expanded(newValues);
      };

      doAsyncLoop(attributeValues, process, reassign);
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
      handled: TokenExpanded,
   ): void {
      const name = strOrBlank(pToken.name);
      let cache: GeneralEntityInfo | ParameterEntityInfo;

      if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN) {
         cache = this.expandParams.geDeclCache[name];
      } else {
         cache = this.expandParams.peDeclCache[name];
      }

      if (name === '' || cache) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN) {
         cache = {
            token: pToken,
            isInternal: !pToken.externalId,
            isUnparsed: !!pToken.nData,
         };
      } else {
         cache = {
            token: pToken,
            isInternal: !pToken.externalId,
         };
      }

      // Store the cache entry in the overall cache only when we are done
      // doing all value processing. This prevents recursive uses of the declaration.
      const cacheAndDeliver = (): void => {
         if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN) {
            this.expandParams.geDeclCache[name] = cache as GeneralEntityInfo; // TS no smart enough.
         } else {
            this.expandParams.peDeclCache[name] = cache as ParameterEntityInfo;
         }

         this.deliverToken(pToken);
         handled();
      };

      if (!cache.isInternal) {
         cacheAndDeliver();
         return;
      }

      const emitter: LoadingEmitter = new LoadingEmitter();
      cache.loading = emitter;

      // REFACTOR/CLEANUP again types do not match correctly
      expandEntityValue(
         pToken.value as any,
         this.expandParams,
         (newValue: EntityValuePToken, errors: Array<XmlError>): void => {
            this.deliverErrors(errors);
            cache.valueCache = newValue;
            delete cache.loading;

            cacheAndDeliver();

            emitter.emit('done', []);
         },
      );
   }

   deliverErrors(errors: Array<XmlError>): void {
      for (const err of errors) {
         this.deliverToken(err);
      }
   }
}

export { EntityExpander };
