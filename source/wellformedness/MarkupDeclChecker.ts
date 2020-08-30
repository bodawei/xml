/* Copyright ® 2019 by 柏大衛. All rights reserved. */

import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank } from 'sToken';
import {
   CONDITIONAL_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   COMMENT_PTOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   SPACE_PTOKEN,
   TEXTDECL_PTOKEN,
   ElidedEntityDeclarationPToken,
   InternalSubsetStartToken,
   ParameterEntityStartPToken,
   GeneralEntityDeclarationPToken,
   ExternalSubsetStartToken,
   attListDeclaration,
   ParameterEntityDeclarationPToken,
   getFirstSToken,
   ParameterEntityReferencePToken,
   ELIDED_ENTITY_DECLARATION_PTOKEN,
   NotationDeclarationPToken,
   TEXT_PTOKEN,
   ConditionalPToken,
} from 'token';
import { PToken } from 'pToken';

import attListDecl, { AttListPToken } from 'source/token/attListDeclaration';
import {
   ELEMENT_DECLARATION_PTOKEN,
   ElementDeclarationPToken,
} from 'source/token/elementDeclaration';
import {
   CHECKER_DONE,
   CheckState,
   Checker,
   scanAttributeValues,
   checkParameterEntity,
   isParamEntityExternal,
} from './checkUtils';

enum States {
   PRE = 'PRE',
   INTERNAL_SUBSET = 'INTERNAL_SUBSET',
   PARAM_START_EXTERNAL_SUBSET = 'EXTERNAL_PARAM_START',
   PARAM_START_INTERNAL_SUBSET = 'PARAM_START_INTERNAL_SUBSET',
   EXTERNAL_SUBSET_START = 'EXTERNAL_SUBSET_START',
   EXTERNAL_SUBSET = 'EXTERNAL_SUBSET',
   INSIDE_CONDITIONAL = 'INSIDE_CONDITIONAL',
   DONE = 'DONE',
}

const WFID = WellFormedError.ID;
const NO_CHANGE = '---INTERNAL---MARKER---';

type StateTable = {
   [startState: string]: {
      [tokenType: string]: States | typeof NO_CHANGE;
   };
};

const transitionsByState: StateTable = {
   [States.PRE]: {
      [INTERNAL_SUBSET_START_TOKEN]: States.INTERNAL_SUBSET,
      [EXTERNAL_SUBSET_START_TOKEN]: States.EXTERNAL_SUBSET_START,
      // [PARAMETER_ENTITY_START_PTOKEN]: This will depend on the context
   },
   [States.EXTERNAL_SUBSET_START]: {
      // §2.8.0 [30]
      [TEXTDECL_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [attListDecl.PTYPE]: States.EXTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PROCESSING_INSTRUCTION_PTOKEN]: States.EXTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.EXTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.EXTERNAL_SUBSET,
      // EXTERNAL_SUBSET_END also needs special handling
      // conditional section will be here
   },
   [States.PARAM_START_EXTERNAL_SUBSET]: {
      // §2.8.0 [30]
      [CONDITIONAL_PTOKEN]: States.EXTERNAL_SUBSET,
      [TEXTDECL_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [attListDecl.PTYPE]: States.EXTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PROCESSING_INSTRUCTION_PTOKEN]: States.EXTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.EXTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.EXTERNAL_SUBSET,
      // PARAMETER_ENTITY_END_PTOKEN will need special handling
   },
   [States.PARAM_START_INTERNAL_SUBSET]: {
      // §2.8.0 [30]
      [TEXTDECL_PTOKEN]: States.INTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [attListDecl.PTYPE]: States.INTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.INTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.INTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [PROCESSING_INSTRUCTION_PTOKEN]: States.INTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.INTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.INTERNAL_SUBSET,
      // PARAMETER_ENTITY_END_PTOKEN will need special handling
   },
   [States.EXTERNAL_SUBSET]: {
      // §2.8.0 [30], [31]
      [CONDITIONAL_PTOKEN]: NO_CHANGE,
      [CONDITIONAL_CLOSE_PTOKEN]: NO_CHANGE,
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [attListDecl.PTYPE]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      // EXTERNAL_SUBSET_END also needs special handling
   },
   [States.INSIDE_CONDITIONAL]: {
      // §2.8.0 [30], [31]
      [CONDITIONAL_PTOKEN]: NO_CHANGE,
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [attListDecl.PTYPE]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [TEXT_PTOKEN]: NO_CHANGE, // This is where this differs from external subset
      [SPACE_PTOKEN]: NO_CHANGE,
      // CONDITIONAL_CLOSE_PTOKEN is handled specially
      // EXTERNAL_SUBSET_END also needs special handling
   },
   [States.INTERNAL_SUBSET]: {
      // §2.8.0 [28a], [28b], [29]
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [attListDecl.PTYPE]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      // INTERNAL_SUBSET_END also needs special handling
   },
   [States.DONE]: {},
};

type DeclarationInfo = {
   [declName: string]: {
      referenceTokens: Array<ParameterEntityReferencePToken>;
   };
};

/*
 * Extract information out of a declaration that we will need to do other
 * checks.
 */
function processDeclaration(
   pToken:
      | GeneralEntityDeclarationPToken
      | ParameterEntityDeclarationPToken
      | ElidedEntityDeclarationPToken,
   declsSeen: DeclarationInfo,
): void {
   const name = strOrBlank(pToken.name);
   const tokens: Array<ParameterEntityReferencePToken> = [];

   if (declsSeen[name] && pToken.type !== ELIDED_ENTITY_DECLARATION_PTOKEN) {
      return;
   }

   declsSeen[name] = {
      referenceTokens: tokens,
   };

   // Refactor/cleanup: we should be allowing starts in these values
   for (const value of pToken.value as any) {
      if (value.type === PARAMETER_ENTITY_START_PTOKEN) {
         tokens.push(value.referencePToken);
      } else if (value.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         tokens.push(value);
      }
   }
}

function checkForRecursionInValue(
   pToken:
      | GeneralEntityDeclarationPToken
      | ParameterEntityDeclarationPToken
      | ElidedEntityDeclarationPToken,
   declContext: Array<string>,
   declsSeen: DeclarationInfo,
   errorCollector: ErrorCollector,
): void {
   const declName = strOrBlank(pToken.name);

   processDeclaration(pToken, declsSeen);

   // §4.1.0: Well-formedness constraint: No Recursion
   //    A parsed entity must not contain a recursive reference to itself,
   //    either directly or indirectly.
   //
   // Situations we need to be concerned with:
   //  - An entity declaration has a reference to itself in its declared value
   //  - If any of the references in its value are also in it are in the declContext.
   // You might ask: What about one of the references in the value referencing another
   // which then references this declaration. That IS a recursive call. However, given
   // the nature of parameter entitity values, those will already have tried to reference
   // this and failed because this declaration wasn't found yet. So, they'll get
   // errord for other reasons. It isn't clear to me that there is value in reporting
   // that here.

   const descendentRefs = declsSeen[declName].referenceTokens;

   for (const refToken of descendentRefs) {
      const refName = strOrBlank(refToken.name);

      errorCollector.check(
         pToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN && refName === declName,
         WellFormedError.ID.REFERENCE_INVALID_RECURSION,
         [declName],
         refToken.open,
      );

      errorCollector.check(
         declContext.includes(refName),
         WellFormedError.ID.REFERENCE_INVALID_RECURSION,
         [refName],
         refToken.open,
      );
   }
}

function checkDeclaration(
   pToken:
      | AttListPToken
      | ElementDeclarationPToken
      | NotationDeclarationPToken
      | GeneralEntityDeclarationPToken
      | ParameterEntityDeclarationPToken,
   state: States,
   ec: ErrorCollector,
): void {
   // §2.8.0: Well-formedness constraint: PEs in Internal Subset
   //     In the internal DTD subset, parameter-entity references must not
   //     occur within markup declarations; they may occur where markup
   //     declarations can occur. (This does not apply to references that
   //     occur in external parameter entities or to the external subset.)
   if (state === States.INTERNAL_SUBSET) {
      ec.check(
         pToken.peRefPlus.length > 0,
         WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
         [],
         pToken.open,
      );

      if (
         pToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN ||
         pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN
      ) {
         let hasPERef = false;

         for (const item of pToken.value) {
            // Refactor/cleanup again getting bitten by the types in entity values
            if (
               item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN ||
               (item.type as any) === PARAMETER_ENTITY_START_PTOKEN
            ) {
               hasPERef = true;
            }
         }

         ec.check(hasPERef, WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT, [], pToken.open);
      }
   }
}

/*
 * This class checks well-formedness constraints on PTokens within a DTD portion of an
 * XML document (See §2.8.0 [28b, 29, 30, 31]).
 *
 * As with the other checkers, this follows a particular usage pattern:
 * - It should be constructed with the state information carried across processing a whole document.
 * - The first token passed to it should be one of the Internal or External Subset Start tokens
 *   or a Parameter Entity Start token (the latter only by recursive calls to itself)
 * - Thereafter, each PToken in the "stream" should be fed to this
 *   - errors, warnings and entity meta data should NOT be delivered to this
 * - If this encounters the end of the expected series of PTokens, it will return CHECKER_DONE
 *
 * This will process any embedded parameter entities without problems.
 */
class MarkupDeclChecker implements Checker {
   private state: States = States.PRE;
   private start!:
      | InternalSubsetStartToken
      | ExternalSubsetStartToken
      | ParameterEntityStartPToken
      | ConditionalPToken;
   private inExternalSubset = false;
   private checkState: CheckState;
   private embeddedChecker?: MarkupDeclChecker;
   private peContext: Array<string>;
   private declsSeen: DeclarationInfo;

   constructor(checkState: CheckState, peContext: Array<string>, inExternalSubset = false) {
      this.checkState = checkState;
      this.inExternalSubset = inExternalSubset;
      this.peContext = peContext;
      this.declsSeen = {};
   }

   check(pToken: PToken, errorCollector: ErrorCollector): void | typeof CHECKER_DONE {
      if (this.state === States.PRE) {
         if (pToken.type === INTERNAL_SUBSET_START_TOKEN) {
            this.inExternalSubset = false;
            this.start = pToken;
         } else if (pToken.type === EXTERNAL_SUBSET_START_TOKEN) {
            this.inExternalSubset = true;
            this.start = pToken;
         } else if (pToken.type === PARAMETER_ENTITY_START_PTOKEN) {
            this.start = pToken;
         } else if (pToken.type === CONDITIONAL_PTOKEN) {
            this.start = pToken;
         }
      } else if (this.state === States.DONE) {
         throw new Error(
            'Internal error: Passed a token to MarkupDeclChecker when it was already done.',
         );
      }

      if (this.embeddedChecker) {
         const result = this.embeddedChecker.check(pToken, errorCollector);

         if (result === CHECKER_DONE) {
            delete this.embeddedChecker;
         }
         return;
      }

      switch (pToken.type) {
         case attListDeclaration.PTYPE:
            scanAttributeValues(
               (pToken as AttListPToken).attDefs,
               this.checkState.generalDecls,
               this.checkState,
               [], // not possible to have general entity context here
               errorCollector,
            );
            checkDeclaration(pToken as any, this.state, errorCollector);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
            checkDeclaration(pToken, this.state, errorCollector);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            const refName = strOrBlank(pToken.name);

            // §4.1.0: Well-formedness constraint: No Recursion
            //    A parsed entity must not contain a recursive reference to itself,
            //    either directly or indirectly.
            errorCollector.check(
               this.peContext.includes(refName),
               WellFormedError.ID.REFERENCE_INVALID_RECURSION,
               [refName],
               pToken.open,
            );

            // §4.1.0: Do whatever existence check we need to. Do this BEFORE we change the has all decls
            checkParameterEntity(
               pToken,
               this.checkState.paramDecls,
               this.checkState,
               errorCollector,
            );
            this.checkState.peRefCount++; // Related to §4.1.0 Entity declared
            // this.checkState.hasAllDecls = false; // That is, a non-validating processor would have seen all declarations
            break;
         case CONDITIONAL_PTOKEN:
            if (this.state !== States.PRE) {
               this.embeddedChecker = new MarkupDeclChecker(
                  this.checkState,
                  this.peContext,
                  this.inExternalSubset,
               );
               this.embeddedChecker.check(pToken, errorCollector);
               return;
            }
            break;
         case PARAMETER_ENTITY_START_PTOKEN:
            if (this.state === States.PRE) {
               const entityName = strOrBlank(pToken.referencePToken.name);

               // §4.1.0: Well-formedness constraint: No Recursion
               //    A parsed entity must not contain a recursive reference to itself,
               //    either directly or indirectly.
               errorCollector.check(
                  this.peContext.includes(entityName),
                  WellFormedError.ID.REFERENCE_INVALID_RECURSION,
                  [entityName],
                  pToken.referencePToken.open,
               );

               this.peContext.push(entityName);

               // §4.1.0: Do whatever existence check we need to. Do this BEFORE we change the has all decls
               checkParameterEntity(
                  pToken.referencePToken,
                  this.checkState.paramDecls,
                  this.checkState,
                  errorCollector,
               );
               this.checkState.peRefCount++; // Related to §4.1.0 Entity declared
               // this.checkState.hasAllDecls = false; // That is, a non-validating processor would have seen all declarations
            } else {
               this.embeddedChecker = new MarkupDeclChecker(
                  this.checkState,
                  this.peContext,
                  this.inExternalSubset,
               );
               this.embeddedChecker.check(pToken, errorCollector);
               return;
            }
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            const inInternalSubset =
               this.state === States.PARAM_START_INTERNAL_SUBSET ||
               this.state === States.INTERNAL_SUBSET;
            this.checkState.generalDecls[strOrBlank(pToken.name)] = {
               token: pToken,
               declaredInInternalSubset: inInternalSubset,
            };
            checkDeclaration(pToken, this.state, errorCollector);
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            checkForRecursionInValue(pToken, this.peContext, this.declsSeen, errorCollector);
            this.checkState.paramDecls[strOrBlank(pToken.name)] = pToken;
            checkDeclaration(pToken, this.state, errorCollector);
            break;
         case ELIDED_ENTITY_DECLARATION_PTOKEN:
            checkForRecursionInValue(pToken, this.peContext, this.declsSeen, errorCollector);
            break;
      }

      this.transition(pToken, errorCollector);

      if ((this.state as any) === States.DONE) {
         // typeHack - this.transition may change the state
         return CHECKER_DONE;
      }
   }

   /*
    * Given the specific PToken, transition in the state graph. Do any special casing as well
    * as just relying on the graph enumerated above.
    */
   private transition(pToken: PToken, ec: ErrorCollector): boolean {
      let newState: States | typeof NO_CHANGE | void;

      if (pToken.type === PARAMETER_ENTITY_START_PTOKEN && this.state === States.PRE) {
         if (isParamEntityExternal(pToken.referencePToken, this.checkState.paramDecls)) {
            newState = this.inExternalSubset
               ? States.PARAM_START_EXTERNAL_SUBSET
               : States.PARAM_START_INTERNAL_SUBSET;
         } else {
            newState = this.inExternalSubset ? States.EXTERNAL_SUBSET : States.INTERNAL_SUBSET;
         }
      } else if (pToken.type === CONDITIONAL_PTOKEN && this.state === States.PRE) {
         newState = this.inExternalSubset ? States.INSIDE_CONDITIONAL : undefined;
      } else if (
         (this.start &&
            pToken.type === PARAMETER_ENTITY_END_PTOKEN &&
            this.start.type === PARAMETER_ENTITY_START_PTOKEN) ||
         (pToken.type === INTERNAL_SUBSET_END_TOKEN &&
            this.start.type === INTERNAL_SUBSET_START_TOKEN) ||
         (pToken.type === EXTERNAL_SUBSET_END_TOKEN &&
            (this.start.type === EXTERNAL_SUBSET_START_TOKEN ||
               this.start.type === CONDITIONAL_PTOKEN)) ||
         (pToken.type === CONDITIONAL_CLOSE_PTOKEN && this.start.type === CONDITIONAL_PTOKEN)
      ) {
         newState = States.DONE;
      }

      if (pToken.type === EXTERNAL_SUBSET_END_TOKEN && this.start.type === CONDITIONAL_PTOKEN) {
         ec.report(WFID.CONDITIONAL_NO_CLOSE, [], getFirstSToken(this.start));
      }

      if (!newState) {
         const transitions = transitionsByState[this.state];
         newState = transitions && transitions[pToken.type];
      }

      if (newState) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         ec.report(WFID.MARKUPDECL_INVALID_TOKEN, [pToken.type], getFirstSToken(pToken));
      }

      return !!newState;
   }
}

export { MarkupDeclChecker };
