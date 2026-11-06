/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import {
   CONFORMANCE_VERSION,
   ENTITY_ID,
   EntityId,
   ConformanceVersion,
   PROBLEM,
   Problem,
} from 'basic';
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
   parseText,
   ParseType,
} from 'pToken';
import { STokenSource, strOrBlank } from 'basic';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   ElidedEntityDeclarationPToken,
   CONDITIONAL_START_PTOKEN,
   ConditionalStartPToken,
   CONDITIONAL_END_PTOKEN,
} from 'token';

import { EntityDetails } from './utils/EntityDetails';
import { expandAttributes } from './utils/expandAttributes';
import { expandEntityValue } from './utils/expandEntityValue';
import { streamParsedReplacementText } from './utils/streamParsedReplacementText';
import { EntityProcessors, ExpandParams } from './types';
import { EntityContextStack } from './utils/EntityContextStack';
import { expandMarkupUnexpanded } from './utils/expandMarkupUnexpanded';
import { entityValueToSTokenSource } from './utils/entityValueToSTokenSource';
import { ConditionalBodyProcessor } from './utils/ConditionalBodyProcessor';
import { ConditionalStartExpander } from './utils/ConditionalStartExpander';

type DeclToken =
   | AttListDeclarationPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken;

type PTokenExpanded = () => void;
type DeliverPToken = (token: ParseToken) => void;

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

   private expandedExternalSubset = false;

   private docTypeDepth = 0;

   private conditionalBodyProcessor?: ConditionalBodyProcessor;

   private conditionalStartExpander?: ConditionalStartExpander;

   private entityContextStack: EntityContextStack = new EntityContextStack();

   constructor(validating: boolean, deliverPToken: DeliverPToken, processors: EntityProcessors) {
      this.deliverToken = deliverPToken;
      this.expandParams = {
         confVer: new ConformanceVersion(),
         entityDetails: new EntityDetails(),
         entityId: new EntityId(''),
         loadExternalEntities: validating,
         utils: processors,
      };
   }

   public expandPToken(pToken: ParseToken, expanded: PTokenExpanded): void {
      if (this.conditionalStartExpander) {
         if (pToken.type === TEXT_PTOKEN) {
            this.conditionalStartExpander.expandPToken(pToken, expanded);
            return;
         } else if (pToken.type !== PROBLEM) {
            this.conditionalStartExpander.finish();
         }
      }
      if (this.conditionalBodyProcessor) {
         this.conditionalBodyProcessor.handleToken(pToken, () => {
            if (this.conditionalBodyProcessor?.isDone) {
               this.conditionalBodyProcessor = undefined;
            }

            expanded();
         });
         return;
      }

      this.innerExpandPToken(pToken, expanded);
   }

   private innerExpandPToken(pToken: ParseToken, expanded: PTokenExpanded): void {
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
            if (this.docTypeDepth > 0) {
               this.deliverToken(pToken);
               expanded();
               return;
            }
            this.docTypeDepth++;
            this.handleDocTypeStart(pToken, expanded);
            break;
         case DOCTYPE_END_PTOKEN:
            if (this.docTypeDepth !== 1) {
               this.docTypeDepth--;
               this.deliverToken(pToken);
               expanded();
               return;
            }
            if (!this.expandedExternalSubset) {
               this.handleAndExpandExternalSubset(pToken, expanded);
            } else {
               this.deliverToken(pToken);
               expanded();
            }
            break;
         case CONDITIONAL_START_PTOKEN:
            if (!this.conditionalStartExpander) {
               this.handleConditional(pToken, expanded);
            }
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
         case CONDITIONAL_END_PTOKEN:
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
   private handleAndExpandExternalSubset(pToken: DocTypeEndPToken, handled: PTokenExpanded): void {
      // if (pToken.type === EXTERNAL_SUBSET_START_TOKEN) {
      //    this.deliverToken(pToken);
      // }

      const externalSubsetToken = this.expandParams.entityDetails.getExternalSubsetReference();
      this.expandedExternalSubset = true;

      if (!externalSubsetToken || !this.expandParams.loadExternalEntities) {
         if (pToken.type === DOCTYPE_END_PTOKEN) {
            this.deliverToken(pToken);
         }
         handled();
         return;
      }

      streamParsedReplacementText(
         externalSubsetToken,
         this.expandParams,
         this.entityContextStack,
         (result, nextPTokenDone) => {
            if (result) {
               this.expandPToken(result, nextPTokenDone);
               return;
            }

            if (pToken.type === DOCTYPE_END_PTOKEN) {
               this.deliverToken(pToken);
            }

            nextPTokenDone(); // acknowledge we are done with the callback from expandBodyReference()
            handled(); // and mark the end of processing of the DOCTYPE end token
         },
      );
   }

   /*
    * Conditional tokens (§3.4.0) need some special expansion help when they have a peRef
    * in their use.  In those cases, call a subroutine which will set up the parsing and
    * processing of any text which comes in afterwards. As that is processed, it will
    * be passed back through the 5th parameter which will deliver those values back through this.
    */
   private handleConditional(
      startToken: ConditionalStartPToken,
      startHandled: PTokenExpanded,
   ): void {
      if (!startToken.unexpanded) {
         this.deliverToken(startToken);
         startHandled();
      } else {
         let startCalledBack = false;
         new ConditionalStartExpander(
            startToken,
            this.expandParams,
            this.entityContextStack,
            (result): void => {
               if (!result.done) {
                  this.conditionalStartExpander = result.hack;
                  startCalledBack = true;
                  startHandled();
               } else {
                  const { newStart, extraText } = result;
                  const isInclude = strOrBlank(newStart.sectionType).toLowerCase() === 'include';
                  this.deliverToken(newStart);
                  this.conditionalStartExpander = undefined;

                  if (!isInclude) {
                     extraText.endText();
                     parseText(extraText, [], (text) => {
                        if (text) {
                           this.deliverToken(text);
                        }
                        if (!startCalledBack) {
                           startHandled();
                        }
                     });
                  } else {
                     this.conditionalBodyProcessor = new ConditionalBodyProcessor(
                        extraText,
                        (
                           sTokenSource: STokenSource,
                           handleNextToken: (
                              token: ParseToken | undefined,
                              expanded: PTokenExpanded,
                           ) => void,
                        ): void => {
                           this.expandParams.utils.parseBody(
                              sTokenSource,
                              ParseType.EXTERNAL_SUBSET,
                              handleNextToken,
                           );
                        },
                        (token: ParseToken | undefined, expanded: PTokenExpanded): void => {
                           if (!token) {
                              expanded();
                           } else {
                              this.innerExpandPToken(token, expanded);
                           }
                        },
                     );

                     if (!startCalledBack) {
                        startHandled();
                     }
                  }
               }
            },
         );
      }
   }

   private handleText(textToken: TextPToken, handled: PTokenExpanded): void {
      this.deliverToken(textToken);
      handled();
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
                  results.expandedTokens ?? [],
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
                  results.expandedTokens ?? [],
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
                  results.expandedTokens ?? [],
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
                  results.expandedTokens ?? [],
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

   private deliverByproducts(byproducts: Array<Problem | ElidedEntityDeclarationPToken>): void {
      for (const err of byproducts) {
         this.deliverToken(err);
      }
   }
}
export { EntityExpander };
