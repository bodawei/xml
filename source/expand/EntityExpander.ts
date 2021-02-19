/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { CONFORMANCE_VERSION, ENTITY_ID, EntityId, ConformanceVersion } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
   AttListDeclarationPToken,
   ContextType,
   ElementDeclarationPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParseToken,
   externalIdToEntityId,
   resumeParseAttListDeclaration,
   resumeParseElementDeclaration,
   resumeParseEntityDeclaration,
   resumeParseNotationDeclaration,
   TextPToken,
} from 'pToken';
import { strOrBlank } from 'sToken';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   InternalSubsetEndToken,
   XmlError,
   ElidedEntityDeclarationPToken,
   CONDITIONAL_PTOKEN,
   ConditionalPToken,
   CONDITIONAL_CLOSE_PTOKEN,
   ConditionalClosePToken,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
} from 'token';

import { EntityDetails } from './utils/EntityDetails';
import { setupConditional } from './utils/setupConditional';
import { expandAttributes } from './utils/expandAttributes';
import { expandEntityValue } from './utils/expandEntityValue';
import { streamParsedReplacementText } from './utils/streamParsedReplacementText';
import { EntityProcessors, ExpandParams } from './types';
import { EntityContextStack } from './utils/EntityContextStack';
import { expandMarkupUnexpanded } from './utils/expandMarkupUnexpanded';
import { entityValueToSTokenSource } from './utils/entityValueToSTokenSource';

type DeclToken =
   | AttListDeclarationPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken;

type PTokenExpanded = () => void;
type DeliverPToken = (token: ParseToken) => void;

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

 This will introduce an ExternalSubsetStart/EndToken around the
 external subset.

 If validating (passed to the constructor) is false, this will not
 load external entities.
\**********************************************************************/

class EntityExpander {
   private deliverToken: DeliverPToken;

   private expandParams: ExpandParams;

   private state = State.AT_START;

   private expandedExternalSubset = false;

   private entityContextStack: EntityContextStack = new EntityContextStack();

   constructor(validating: boolean, deliverPToken: DeliverPToken, processors: EntityProcessors) {
      this.deliverToken = deliverPToken;
      this.expandParams = {
         entityId: new EntityId(''),
         confVer: new ConformanceVersion(),
         conditionalStack: [],
         entityDetails: new EntityDetails(),
         loadExternalEntities: validating,
         utils: processors,
      };
   }

   public expandPToken(pToken: ParseToken, expanded: PTokenExpanded): void {
      switch (pToken.type) {
         case ENTITY_ID:
            this.expandParams.entityId = pToken;
            this.entityContextStack.pushDocumentEntity(pToken);
            this.deliverToken(pToken);
            expanded();
            break;
         case CONFORMANCE_VERSION:
            this.expandParams.confVer = pToken;
            this.deliverToken(pToken);
            expanded();
            break;
         case DOCTYPE_START_PTOKEN:
            this.handleDocTypeStart(pToken, expanded);
            break;
         case INTERNAL_SUBSET_START_TOKEN:
            this.state = State.IN_INTERNAL_SUBSET;
            this.deliverToken(pToken);
            expanded();
            break;
         case INTERNAL_SUBSET_END_TOKEN:
            this.handleAndExpandExternalSubset(pToken, expanded);
            break;
         case DOCTYPE_END_PTOKEN:
            if (!this.expandedExternalSubset) {
               this.handleAndExpandExternalSubset(pToken, expanded);
            } else {
               this.state = State.IN_CONTENT;
               this.deliverToken(pToken);
               expanded();
            }
            break;
         case CONDITIONAL_PTOKEN:
            this.handleConditional(pToken, expanded);
            break;
         case CONDITIONAL_CLOSE_PTOKEN:
            this.handleConditionalEnd(pToken, expanded);
            break;
         case ATTLIST_DECLARATION_PTOKEN:
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
         case TEXT_PTOKEN:
            this.handleText(pToken, expanded);
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

      if (pToken.externalId) {
         this.expandParams.entityDetails.addExternalSubset(pToken.externalId);
      }

      handled();
   }

   /*
    * When we reach the end of the internal subset or the doc type declaration,
    * send the end token if we were
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
   private handleAndExpandExternalSubset(
      pToken: InternalSubsetEndToken | DocTypeEndPToken,
      handled: PTokenExpanded,
   ): void {
      this.emptyConditionalStack(() => {
         if (pToken.type === INTERNAL_SUBSET_END_TOKEN) {
            this.deliverToken(pToken);
         }

         const externalSubsetToken = this.expandParams.entityDetails.getExternalSubsetReference();
         this.expandedExternalSubset = true;

         if (!externalSubsetToken || !this.expandParams.loadExternalEntities) {
            if (pToken.type === DOCTYPE_END_PTOKEN) {
               this.state = State.IN_CONTENT;
               this.deliverToken(pToken);
            }
            handled();
            return;
         }

         this.state = State.IN_EXTERNAL_SUBSET;

         streamParsedReplacementText(
            externalSubsetToken,
            this.expandParams,
            this.entityContextStack,
            (result, nextPTokenDone) => {
               if (result) {
                  this.expandPToken(result, nextPTokenDone);
                  return;
               }

               this.emptyConditionalStack(() => {
                  if (pToken.type === DOCTYPE_END_PTOKEN) {
                     this.state = State.IN_CONTENT;
                     this.deliverToken(pToken);
                  }

                  nextPTokenDone(); // acknowledge we are done with the callback from expandBodyReference()
                  handled(); // and mark the end of processing of the DOCTYPE end token
               });
            },
         );
      });
   }

   private emptyConditionalStack(done: () => void): void {
      const stack = this.expandParams.conditionalStack;

      let topCondition = stack[stack.length - 1];

      while (topCondition && !topCondition.source) {
         this.expandParams.conditionalStack.pop();
         topCondition = stack[stack.length - 1];
      }

      if (topCondition && topCondition.source) {
         topCondition.textIsFinished = (): void => {
            this.emptyConditionalStack(done);
         };
         topCondition.source.endText();
      } else {
         done();
      }
   }

   /*
    * Conditional tokens (§3.4.0) need some special expansion help when they have a peRef
    * in their use.  In those cases, call a subroutine which will set up the parsing and
    * processing of any text which comes in afterwards. As that is processed, it will
    * be passed back through the 5th parameter which will deliver those values back through this.
    */
   private handleConditional(startToken: ConditionalPToken, handled: PTokenExpanded): void {
      if (!startToken.peRef) {
         this.deliverToken(startToken);
         handled();
         return;
      }

      setupConditional(
         startToken.peRef,
         this.expandParams,
         this.entityContextStack,
         this.state === State.IN_CONTENT
            ? ContextType.GENERAL_ENTITY
            : ContextType.PARAMETER_ENTITY,
         (token, tokenHandled) => {
            // Specially handle text, as we don't want these fed back into handleText()
            if (token.type === TEXT_PTOKEN) {
               this.deliverToken(token);
               tokenHandled();
            } else {
               this.expandPToken(token, tokenHandled);
            }
         },
         (conditionalState) => {
            const newStart = new ConditionalPToken(startToken, {
               sectionType: conditionalState.sectionType,
            });
            this.expandParams.conditionalStack.push(conditionalState);
            this.deliverToken(newStart);
            handled();
         },
      );
   }

   /*
    * Ordinarily we pass text through unscathed. However, if we are in the middle
    * of processing a conditional section which had a peRef, then the text token
    * represents unprocessed text.  We need to add this text into the STokenSource
    * that was set up by setupConditional().
    */
   private handleText(textToken: TextPToken, handled: PTokenExpanded): void {
      const depth = this.expandParams.conditionalStack.length;
      const info = this.expandParams.conditionalStack[depth - 1];

      if (info && info.source) {
         info.source.addText(strOrBlank(textToken.text)); // need to add range
      } else {
         this.deliverToken(textToken);
      }

      handled();
   }

   /*
    * When we reach the end of a conditional section (which may well be within another),
    * if it was one with an expanded INCLUDE/IGNORE value, then we need to wrap up
    * the consumption of the TextPToken values that came between the start and the
    * end.
    */
   private handleConditionalEnd(endToken: ConditionalClosePToken, handled: PTokenExpanded): void {
      const info = this.expandParams.conditionalStack.pop();

      if (info && info.source) {
         info.textIsFinished = (): void => {
            this.deliverToken(endToken);
            handled();
         };
         info.source.endText();
      } else {
         this.deliverToken(endToken);
         handled();
      }
   }

   /*
    * Declarations can have parameter entity references within them.
    *    e.g. <!NOTATION %moreDetails;>
    * if that happens, we must first expand that parameter entity reference
    * and construct the full declaration token using the data from that
    * parameter entity before we can actually process the declaration.
    */
   private handleDeclaration(declarationPToken: DeclToken, handled: PTokenExpanded): void {
      if (declarationPToken.type === NOTATION_DECLARATION_PTOKEN) {
         expandMarkupUnexpanded(
            declarationPToken.unexpanded ? declarationPToken.unexpanded.tokens : [], // eek
            this.expandParams,
            this.entityContextStack,
            (results) => {
               this.deliverByproducts(results.byproducts);
               const source = entityValueToSTokenSource(
                  results.expandedTokens || [],
                  this.expandParams.entityId,
                  true,
               ); // THIS entityId IS WRONG!!!!

               resumeParseNotationDeclaration(source, declarationPToken, (innerResults) => {
                  this.deliverToken(innerResults);
                  handled();
               });
            },
         );
         return;
      } else if (declarationPToken.type === ATTLIST_DECLARATION_PTOKEN) {
         if (!declarationPToken.unexpanded) {
            this.handleAttListDeclaration(declarationPToken, handled);
            return;
         }

         expandMarkupUnexpanded(
            declarationPToken.unexpanded.tokens,
            this.expandParams,
            this.entityContextStack,
            (results) => {
               this.deliverByproducts(results.byproducts);
               const source = entityValueToSTokenSource(
                  results.expandedTokens || [],
                  this.expandParams.entityId,
                  true,
               ); // THIS entityId IS WRONG!!!!

               resumeParseAttListDeclaration(source, declarationPToken, (innerResults) => {
                  this.handleAttListDeclaration(innerResults, handled);
               });
            },
         );
         return;
      } else if (
         declarationPToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN ||
         declarationPToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN
      ) {
         expandMarkupUnexpanded(
            declarationPToken.unexpanded ? declarationPToken.unexpanded.tokens : [],
            this.expandParams,
            this.entityContextStack,
            (results) => {
               this.deliverByproducts(results.byproducts);
               const source = entityValueToSTokenSource(
                  results.expandedTokens || [],
                  this.expandParams.entityId,
                  true,
               ); // THIS entityId IS WRONG!!!!

               resumeParseEntityDeclaration(source, declarationPToken, (innerResults) => {
                  this.handleEntityDeclaration(innerResults, handled);
               });
            },
         );
         return;
      } else {
         expandMarkupUnexpanded(
            declarationPToken.unexpanded ? declarationPToken.unexpanded.tokens : [],
            this.expandParams,
            this.entityContextStack,
            (results) => {
               this.deliverByproducts(results.byproducts);
               const source = entityValueToSTokenSource(
                  results.expandedTokens || [],
                  this.expandParams.entityId,
                  true,
               ); // THIS entityId IS WRONG!!!!

               resumeParseElementDeclaration(source, declarationPToken, (innerResults) => {
                  this.deliverToken(innerResults);
                  handled();
               });
            },
         );
         return;
      }
   }

   /*
    * For ATTLIST tokens, the default values need to be expanded at declaration time,
    * not at use (which is a bit of a surprise).
    *
    * §4.1.0 Well-formedness constraint: Entity Declared
    *    The declaration of a general entity must precede any reference to it which
    *    appears in a default value in an attribute-list declaration.
    *
    * The default handling is declared in §2.3 [10] and §3.3.2 [60]
    */
   private handleAttListDeclaration(
      pToken: AttListDeclarationPToken,
      handled: PTokenExpanded,
   ): void {
      // REFACTOR/CLEANUP: default type is wrong.
      expandAttributes(pToken.attDefs, this.expandParams, this.entityContextStack, (results) => {
         const attDefs = [];

         for (let index = 0; index < results.length; index++) {
            attDefs[index] = {
               ...pToken.attDefs[index],
               value: results[index].newValue, // REFACTOR/CLEANUP: We probably can't actually modify the object directly
            };
            this.deliverByproducts(results[index].byproducts);
         }

         this.deliverToken(
            new AttListDeclarationPToken(pToken, {
               attDefs,
            }),
         );
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
    *
    * §2.8.0, §4.4.5 and §4.5 all discuss parameter entities in an EntityValue.
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
         const entityId = externalIdToEntityId(pToken.externalId);
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const entityLoc = this.expandParams.utils.resolveEntityId(
            this.entityContextStack.getCurrentEntityLoc(),
            entityId,
         );
         this.expandParams.entityDetails.addEntity(pToken, undefined, entityLoc);
         this.deliverToken(pToken);
         handled();
         return;
      }

      // REFACTOR/CLEANUP again types do not match correctly`
      expandEntityValue(
         pToken.value as any,
         this.expandParams,
         this.entityContextStack,
         (result): void => {
            this.expandParams.entityDetails.addEntity(
               pToken,
               result.newValue,
               this.entityContextStack.getCurrentEntityLoc(),
            );

            this.deliverByproducts(result.byproducts);
            this.deliverToken(pToken);
            handled();
         },
      );
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
      expandAttributes(
         pToken.attributes as any,
         this.expandParams,
         this.entityContextStack,
         (results) => {
            for (let index = 0; index < results.length; index++) {
               pToken.attributes[index].value = results[index].newValue; // REFACTOR/CLEANUP: We probably can't actually modify the object directly
               this.deliverByproducts(results[index].byproducts);
            }

            this.deliverToken(pToken);
            handled();
         },
      );
   }

   handleEntityReference(
      pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken,
      handled: PTokenExpanded,
   ): void {
      let countSeen = 0;

      // §4.1.0: Well-formedness constraint: No Recursion
      //    A parsed entity must not contain a recursive reference to itself,
      //    either directly or indirectly.
      if (this.entityContextStack.hasName(pToken)) {
         this.deliverToken(pToken);
         handled();
         return;
      }

      streamParsedReplacementText(
         pToken,
         this.expandParams,
         this.entityContextStack,
         (result, done) => {
            if (!result) {
               // BUG 1
               if (countSeen === 0) {
                  this.deliverToken(pToken);
               }

               done();
               handled();
            } else {
               countSeen++;
               this.expandPToken(result, done);
            }
         },
      );
   }

   private deliverByproducts(byproducts: Array<XmlError | ElidedEntityDeclarationPToken>): void {
      for (const err of byproducts) {
         this.deliverToken(err);
      }
   }
}
export { EntityExpander };
