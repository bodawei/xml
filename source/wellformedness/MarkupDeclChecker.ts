/* Copyright ® 2019 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXTDECL_PTOKEN,
   TEXT_PTOKEN,
   AttListDeclarationPToken,
   ElementDeclarationPToken,
   GeneralEntityDeclarationPToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParseToken,
} from 'pToken';
import { strOrBlank } from 'basic';
import {
   COMMENT_PTOKEN,
   CONDITIONAL_START_PTOKEN,
   CONDITIONAL_END_PTOKEN,
   ELIDED_ENTITY_DECLARATION_PTOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   SPACE_PTOKEN,
   ElidedEntityDeclarationPToken,
   getFirstSToken,
   DOCTYPE_START_PTOKEN,
   DOCTYPE_END_PTOKEN,
} from 'token';

import { wellFormedErrorCodes } from './error/wellFormedError';
import { Warning } from './error/warning';
import { warningCodes } from './error/warningCodes';

import {
   CHECKER_DONE,
   CheckState,
   MarkupStart,
   MarkupChecker,
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

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;
const NO_CHANGE = '---INTERNAL---MARKER---';

type StateTable = Record<string, Record<string, States | typeof NO_CHANGE> | undefined>;

const transitionsByState: StateTable = {
   [States.PRE]: {
      [DOCTYPE_START_PTOKEN]: States.INTERNAL_SUBSET,
      [EXTERNAL_SUBSET_START_TOKEN]: States.EXTERNAL_SUBSET_START,
      // [PARAMETER_ENTITY_START_PTOKEN]: This will depend on the context
   },
   [States.EXTERNAL_SUBSET_START]: {
      // §2.8.0 [30]
      [ATTLIST_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [NOTATION_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: States.EXTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.EXTERNAL_SUBSET,
      [TEXTDECL_PTOKEN]: States.EXTERNAL_SUBSET,
      // EXTERNAL_SUBSET_END also needs special handling
      // conditional section will be here
   },
   [States.PARAM_START_EXTERNAL_SUBSET]: {
      // §2.8.0 [30]
      [ATTLIST_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.EXTERNAL_SUBSET,
      [CONDITIONAL_START_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [NOTATION_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.EXTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.EXTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: States.EXTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.EXTERNAL_SUBSET,
      [TEXTDECL_PTOKEN]: States.EXTERNAL_SUBSET,
      // PARAMETER_ENTITY_END_PTOKEN will need special handling
   },
   [States.PARAM_START_INTERNAL_SUBSET]: {
      // §2.8.0 [30]
      [ATTLIST_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [COMMENT_PTOKEN]: States.INTERNAL_SUBSET,
      [ELEMENT_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [NOTATION_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: States.INTERNAL_SUBSET,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: States.INTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PARAMETER_ENTITY_START_PTOKEN]: States.INTERNAL_SUBSET, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: States.INTERNAL_SUBSET,
      [SPACE_PTOKEN]: States.INTERNAL_SUBSET,
      [TEXTDECL_PTOKEN]: States.INTERNAL_SUBSET,
      // PARAMETER_ENTITY_END_PTOKEN will need special handling
   },
   [States.EXTERNAL_SUBSET]: {
      // §2.8.0 [30], [31]
      [ATTLIST_DECLARATION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [CONDITIONAL_END_PTOKEN]: NO_CHANGE,
      [CONDITIONAL_START_PTOKEN]: NO_CHANGE,
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      // EXTERNAL_SUBSET_END also needs special handling
   },
   [States.INSIDE_CONDITIONAL]: {
      // §2.8.0 [30], [31]
      [ATTLIST_DECLARATION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [CONDITIONAL_START_PTOKEN]: NO_CHANGE,
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      [TEXT_PTOKEN]: NO_CHANGE, // This is where this differs from external subset
      // CONDITIONAL_END_PTOKEN is handled specially
      // EXTERNAL_SUBSET_END also needs special handling
   },
   [States.INTERNAL_SUBSET]: {
      // §2.8.0 [28a], [28b], [29]
      [ATTLIST_DECLARATION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
      [ELEMENT_DECLARATION_PTOKEN]: NO_CHANGE,
      [ELIDED_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [NOTATION_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_DECLARATION_PTOKEN]: NO_CHANGE,
      [PARAMETER_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE, // §4.1.0: Well-Formedness Constraint: In DTD Parameter-entity references may only appear in the DTD.
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      // INTERNAL_SUBSET_END also needs special handling
   },
   [States.DONE]: {},
};

type DeclarationInfo = Record<
   string,
   | {
        referenceTokens: Array<ParameterEntityReferencePToken>;
     }
   | undefined
>;

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
   for (const value of pToken.value) {
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
   collector: Collector,
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

   // We always have something in referenceTokens by this point, because processDeclaration always sets that
   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
   const descendentRefs = declsSeen[declName]?.referenceTokens!;

   for (const refToken of descendentRefs) {
      const refName = strOrBlank(refToken.name);

      collector.check(
         pToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN && refName === declName,
         WFEID.REFERENCE_INVALID_RECURSION,
         [declName],
         refToken.open,
      );

      collector.check(
         declContext.includes(refName),
         WFEID.REFERENCE_INVALID_RECURSION,
         [refName],
         refToken.open,
      );
   }
}

function checkDeclaration(
   pToken:
      | AttListDeclarationPToken
      | ElementDeclarationPToken
      | NotationDeclarationPToken
      | GeneralEntityDeclarationPToken
      | ParameterEntityDeclarationPToken,
   state: States,
   collector: Collector,
): void {
   // §2.8.0: Well-formedness constraint: PEs in Internal Subset
   //     In the internal DTD subset, parameter-entity references must not
   //     occur within markup declarations; they may occur where markup
   //     declarations can occur. (This does not apply to references that
   //     occur in external parameter entities or to the external subset.)
   if (state === States.INTERNAL_SUBSET) {
      collector.check(pToken.unexpanded, WFEID.REFERENCE_INVALID_SUBSET_CONTEXT, [], pToken.open);

      if (
         pToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN ||
         pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN
      ) {
         let hasPERef = false;

         for (const item of pToken.value) {
            // Refactor/cleanup again getting bitten by the types in entity values
            if (
               item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN ||
               item.type === PARAMETER_ENTITY_START_PTOKEN
            ) {
               hasPERef = true;
            }
         }

         collector.check(hasPERef, WFEID.REFERENCE_INVALID_SUBSET_CONTEXT, [], pToken.open);
      }
   }
}

function checkAttlistContext(
   pToken: AttListDeclarationPToken,
   state: CheckState,
   collector: Collector,
): void {
   const elName = strOrBlank(pToken.elementName);

   const elDetails = state.atts[elName] ?? {};

   if (state.atts[elName]) {
      // §3.3: For interoperability, writers of DTDs may choose to provide at most one
      //   attribute-list declaration for a given element type ... For interoperability,
      //   an XML processor may at user option issue a warning when more than one
      //   attribute-list declaration is provided for a given element type,
      collector.reportProblem(
         Warning,
         WID.ATTLISTDECL_ELEMENT_XTRA_DECLARATION,
         [elName],
         pToken.elementName,
      );
   }

   for (const def of pToken.attDefs) {
      const attName = strOrBlank(def.name);

      if (elDetails[attName]) {
         // §3.3.0: ... For interoperability, an XML processor may at user option
         //   issue a warning when ... more than one attribute definition is provided for a given
         //   attribute, but this is not an error.
         collector.reportProblem(
            Warning,
            WID.ATTLISTDECL_ATTR_XTRA_DECLARATION,
            [elName, attName],
            def.name,
         );
      }

      elDetails[attName] = true;
   }

   state.atts[elName] = elDetails;
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
class MarkupDeclChecker implements MarkupChecker {
   private state: States = States.PRE;

   private start: MarkupStart;

   private inExternalContext = false;

   private checkState: CheckState;

   private embeddedChecker?: MarkupDeclChecker;

   private peContext: Array<string>;

   private declsSeen: DeclarationInfo;

   public constructor(
      start: MarkupStart,
      collector: Collector,
      checkState: CheckState,
      peContext: Array<string>,
      inExternalContext = false,
   ) {
      this.checkState = checkState;
      this.inExternalContext = inExternalContext;
      this.peContext = peContext;
      this.declsSeen = {};
      this.start = start;

      if (start.type === DOCTYPE_START_PTOKEN) {
         this.inExternalContext = false;
         this.state = States.INTERNAL_SUBSET;
      } else if (start.type === EXTERNAL_SUBSET_START_TOKEN) {
         this.inExternalContext = true;
         this.state = States.EXTERNAL_SUBSET_START;
      } else if (start.type === PARAMETER_ENTITY_START_PTOKEN) {
         this.checkPERef(start.referencePToken, collector, true);

         if (isParamEntityExternal(start.referencePToken, this.checkState.paramDecls)) {
            this.state = States.PARAM_START_EXTERNAL_SUBSET;
            this.inExternalContext = true;
         } else {
            this.state = this.inExternalContext ? States.EXTERNAL_SUBSET : States.INTERNAL_SUBSET;
         }
      } else {
         if (this.inExternalContext) {
            this.state = States.INSIDE_CONDITIONAL;
         } else {
            collector.report(WFEID.MARKUPDECL_INVALID_TOKEN, [start.type], getFirstSToken(start));
         }
      }
   }

   public check(pToken: ParseToken, collector: Collector): undefined | typeof CHECKER_DONE {
      if (this.state === States.DONE) {
         throw new Error(
            'Internal error: Passed a token to MarkupDeclChecker when it was already done.',
         );
      }

      if (this.embeddedChecker) {
         const result = this.embeddedChecker.check(pToken, collector);

         if (result === CHECKER_DONE) {
            delete this.embeddedChecker;
         }
         return;
      }

      switch (pToken.type) {
         case ATTLIST_DECLARATION_PTOKEN:
            scanAttributeValues(
               pToken.attDefs,
               this.checkState.generalDecls,
               this.checkState,
               [], // not possible to have general entity context here
               collector,
            );
            checkAttlistContext(pToken, this.checkState, collector);
            checkDeclaration(pToken, this.state, collector);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
            const type = strOrBlank(pToken.contentSpec).toUpperCase();
            checkDeclaration(pToken, this.state, collector);
            this.checkState.elementDecl[strOrBlank(pToken.name)] =
               type === 'EMPTY' ? 'EMPTY' : 'OTHER';
            break;
         case NOTATION_DECLARATION_PTOKEN:
            checkDeclaration(pToken, this.state, collector);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.checkPERef(pToken, collector, false);
            break;
         case EXTERNAL_SUBSET_START_TOKEN:
            this.embeddedChecker = new MarkupDeclChecker(
               pToken,
               collector,
               this.checkState,
               this.peContext,
               this.inExternalContext,
            );
            return;
         case CONDITIONAL_START_PTOKEN:
            this.embeddedChecker = new MarkupDeclChecker(
               pToken,
               collector,
               this.checkState,
               this.peContext,
               this.inExternalContext,
            );
            return;
         case PARAMETER_ENTITY_START_PTOKEN:
            this.embeddedChecker = new MarkupDeclChecker(
               pToken,
               collector,
               this.checkState,
               this.peContext,
               this.inExternalContext,
            );
            return;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            const inInternalSubset =
               this.state === States.PARAM_START_INTERNAL_SUBSET ||
               this.state === States.INTERNAL_SUBSET;
            const geDeclName = strOrBlank(pToken.name);

            if (!this.checkState.generalDecls[geDeclName]) {
               this.checkState.generalDecls[geDeclName] = {
                  declaredInInternalSubset: inInternalSubset,
                  token: pToken,
               };
            } else {
               // §4.2 If the same entity is declared more than once, ... at user option,
               // an XML processor may issue a warning if entities are declared multiple times.
               collector.reportProblem(
                  Warning,
                  WID.ENTITYDECL_XRA_DECLARATION,
                  [geDeclName],
                  pToken.open,
               );
            }
            checkDeclaration(pToken, this.state, collector);
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            const peDeclName = strOrBlank(pToken.name);
            checkForRecursionInValue(pToken, this.peContext, this.declsSeen, collector);
            if (!this.checkState.paramDecls[peDeclName]) {
               this.checkState.paramDecls[peDeclName] = pToken;
            } else {
               // §4.2 If the same entity is declared more than once, ... at user option,
               // an XML processor may issue a warning if entities are declared multiple times.
               collector.reportProblem(
                  Warning,
                  WID.ENTITYDECL_XRA_DECLARATION,
                  [peDeclName],
                  pToken.open,
               );
            }
            checkDeclaration(pToken, this.state, collector);
            break;
         case ELIDED_ENTITY_DECLARATION_PTOKEN:
            checkForRecursionInValue(pToken, this.peContext, this.declsSeen, collector);
            break;
         default:
            // do nothing
            break;
      }

      this.transition(pToken, collector);

      // @ts-expect-error ts2367 the transition may change the state.
      if (this.state === States.DONE) {
         return CHECKER_DONE;
      }
   }

   readonly inSecondPassContxt = false;

   private checkPERef(
      pToken: ParameterEntityReferencePToken,
      collector: Collector,
      addToContext: boolean,
   ): void {
      const entityName = strOrBlank(pToken.name);

      // §4.1.0: Well-formedness constraint: No Recursion
      //    A parsed entity must not contain a recursive reference to itself,
      //    either directly or indirectly.
      collector.check(
         this.peContext.includes(entityName),
         WFEID.REFERENCE_INVALID_RECURSION,
         [entityName],
         pToken.open,
      );

      if (addToContext) {
         this.peContext.push(entityName);
      }

      // §4.1.0: Do whatever existence check we need to. Do this BEFORE we change the has all decls
      checkParameterEntity(pToken, this.checkState.paramDecls, this.checkState, collector);

      this.checkState.peRefCount++; // Related to §4.1.0 Entity declared
      // this.checkState.hasAllDecls = false; // That is, a non-validating processor would have seen all declarations
   }

   /*
    * Given the specific PToken, transition in the state graph. Do any special casing as well
    * as just relying on the graph enumerated above.
    */
   private transition(pToken: ParseToken, collector: Collector): boolean {
      let newState: States | typeof NO_CHANGE | undefined;

      if (
         (pToken.type === PARAMETER_ENTITY_END_PTOKEN &&
            this.start.type === PARAMETER_ENTITY_START_PTOKEN) ||
         (pToken.type === DOCTYPE_END_PTOKEN && this.start.type === DOCTYPE_START_PTOKEN) ||
         (pToken.type === EXTERNAL_SUBSET_END_TOKEN &&
            (this.start.type === EXTERNAL_SUBSET_START_TOKEN ||
               this.start.type === CONDITIONAL_START_PTOKEN)) ||
         (pToken.type === CONDITIONAL_END_PTOKEN && this.start.type === CONDITIONAL_START_PTOKEN)
      ) {
         newState = States.DONE;
      }

      if (pToken.type === PARAMETER_ENTITY_END_PTOKEN) {
         this.peContext.pop();
      }

      if (
         pToken.type === EXTERNAL_SUBSET_END_TOKEN &&
         this.start.type === CONDITIONAL_START_PTOKEN
      ) {
         collector.report(WFEID.CONDITIONAL_NO_CLOSE, [], getFirstSToken(this.start));
      }

      if (!newState) {
         const transitions = transitionsByState[this.state];
         newState = transitions?.[pToken.type];
      }

      if (newState) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         collector.report(WFEID.MARKUPDECL_INVALID_TOKEN, [pToken.type], getFirstSToken(pToken));
      }

      return !!newState;
   }
}

export { MarkupDeclChecker };
