/* Copyright ® 2019 by 柏大衛. All rights reserved. */

import { ENTITY_META_DATA } from 'basic';
import { ERROR_TYPE, ErrorCollector, WellFormedError } from 'error';
import {
   COMMENT_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   SPACE_PTOKEN,
   XMLDECL_PTOKEN,
   PToken,
   getFirstSToken,
} from 'token';

import checkConditionalStartWellFormed from './token/conditionalStart';
import { Checker, CheckerConstructor, CheckState, CHECKER_DONE } from './checkUtils';
import { strOrBlank, SToken } from 'sToken';
import { checkMap } from './checkMap';

const NO_CHANGE = '---INTERNAL---MARKER---';

type StateTable = {
   [startState: string]: {
      [tokenType: string]: State | typeof NO_CHANGE;
   };
};

type CheckerMap = {
   content: CheckerConstructor;
   dtd: CheckerConstructor;
};

enum State {
   START = 'START', // §2.1.0: Production [1]
   PROLOG_LEADING_MISC = 'PROLOG_LEADING_MISC', // §2.8.0: Production [22]
   PROLOG_IN_DOCTYPE = 'PROLOG_IN_DOCTYPE', // Represents the (hopefully) instantaneous gap between the doctype start and end and any DTD content
   PROLOG_DTD = 'PROLOG_DTD', // §2.8.0: Production [28]
   PROLOG_TRAILING_MISC = 'PROLOG_TRAILING_MISC', // §2.8.0: Production [22]
   ELEMENT = 'ELEMENT', // §2.1.0: Production [1]
   TRAILING_MISC = 'TRAILING_MISC', // §2.1.0: Production [1]
}

const transitionsByState: StateTable = {
   [State.START]: {
      [XMLDECL_PTOKEN]: State.PROLOG_LEADING_MISC,
   },
   [State.PROLOG_LEADING_MISC]: {
      [COMMENT_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      [DOCTYPE_START_PTOKEN]: State.PROLOG_IN_DOCTYPE,
      [ELEMENT_START_PTOKEN]: State.ELEMENT,
      [ELEMENT_EMPTY_PTOKEN]: State.ELEMENT,
   },
   [State.PROLOG_IN_DOCTYPE]: {
      [SPACE_PTOKEN]: NO_CHANGE, // @@@ TEST
      [INTERNAL_SUBSET_START_TOKEN]: State.PROLOG_DTD,
      [EXTERNAL_SUBSET_START_TOKEN]: State.PROLOG_DTD,
      [DOCTYPE_END_PTOKEN]: State.PROLOG_TRAILING_MISC,
   },
   [State.PROLOG_DTD]: {
      // exit this through below. Will transition to PROLOG_IN_DOCTYPE
   },
   [State.PROLOG_TRAILING_MISC]: {
      [COMMENT_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
      [ELEMENT_START_PTOKEN]: State.ELEMENT,
      [ELEMENT_EMPTY_PTOKEN]: State.ELEMENT,
   },
   [State.ELEMENT]: {
      // exit this through below. Will transition to TRAILING_MISC
   },
   [State.TRAILING_MISC]: {
      [COMMENT_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
   },
};

enum EntityType {
   DOCUMENT,
   GENERAL,
   PARAMETER,
}

/*
 * This checks the syntactic/well-formedness details of a document entity and the well-formedness
 * constraints of tokens within the document.
 *
 * While this was built with the expectation of consuming output from either a PToken parser or an
 * EntityExpander, and testing has focused around that, it should be able to be used to do WFC checks
 * on any source of PTokens.
 */
class DocumentChecker {
   private state: State = State.START;
   private checkState: CheckState = new CheckState();
   private subChecker?: Checker;
   private checkers: CheckerMap;
   private internalSubsetSeen = false;
   private externalSubsetSeen = false;

   constructor(checkerMap: CheckerMap) {
      this.checkers = checkerMap;
   }

   check(pToken: PToken, errorCollector: ErrorCollector): void | typeof CHECKER_DONE {
      if (pToken.type === ENTITY_META_DATA) {
         this.checkState.emd = pToken;
         return;
      } else if ((pToken as any).type === ERROR_TYPE) {
         return;
      }

      if (pToken.type === DOCTYPE_END_PTOKEN) {
         // Report errors with the starting context of the DOCTYPE start
         const specialErrorCollector = new ErrorCollector(
            pToken.docTypeStartPToken.open,
            WellFormedError,
         );
         pToken.checkWellFormed(specialErrorCollector, this.checkState.emd);
         errorCollector.appendFrom(specialErrorCollector);
      } else if (pToken.type === 'CONDITIONAL_PTOKEN') {
         checkConditionalStartWellFormed(pToken, errorCollector, this.checkState.emd);
      } else if (checkMap[pToken.type]) {
         checkMap[pToken.type](pToken, errorCollector, this.checkState.emd);
      } else if ((pToken as any).checkWellFormed) {
         (pToken as any).checkWellFormed(errorCollector, this.checkState.emd);
      }

      if (this.subChecker) {
         const result = this.subChecker.check(pToken, errorCollector);

         if (result === CHECKER_DONE) {
            if (this.state === State.ELEMENT) {
               this.state = State.TRAILING_MISC;
            } else {
               this.state = State.PROLOG_IN_DOCTYPE;
            }

            delete this.subChecker;
         }

         return;
      }

      switch (pToken.type) {
         case XMLDECL_PTOKEN:
            if (this.state === State.START) {
               // §4.1.0: WFC Entiy Declared requires us to know if we're standalone
               this.checkState.isStandalone = pToken.isStandalone();
            }
            break;
         case DOCTYPE_START_PTOKEN:
            if (this.state === State.PROLOG_LEADING_MISC) {
               // §4.1.0: WFC Entiy Declared requires us to know what our DTD situation is
               this.checkState.hasNoDTD = !pToken.openSubset && !pToken.externalId;
               this.checkState.hasExternalDTD = !!pToken.externalId;
            }
            break;
         case INTERNAL_SUBSET_START_TOKEN:
         case EXTERNAL_SUBSET_START_TOKEN:
            this.transition(pToken, errorCollector);

            if (pToken.type === INTERNAL_SUBSET_START_TOKEN) {
               this.internalSubsetSeen = true;
            } else {
               this.externalSubsetSeen = true;
            }

            if (this.state === State.PROLOG_DTD) {
               this.subChecker = new this.checkers.dtd(this.checkState, []);
               this.subChecker.check(pToken, errorCollector);
            }
            return;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            this.transition(pToken, errorCollector);

            if (this.state === State.ELEMENT) {
               const checker = new this.checkers.content(this.checkState, []);
               const result = checker.check(pToken, errorCollector);

               if (result === CHECKER_DONE) {
                  this.state = State.TRAILING_MISC;
               } else {
                  this.subChecker = checker;
               }
            }
            return;
      }

      this.transition(pToken, errorCollector);
   }

   public finish(ec: ErrorCollector): void {
      if (this.state !== State.TRAILING_MISC) {
         ec.report(WellFormedError.ID.DOC_END_EARLY);
      }
   }

   private transition(pToken: PToken, ec: ErrorCollector): void {
      const transitions = transitionsByState[this.state];
      const newState = transitions && transitions[pToken.type];
      let badSubset = false;

      if (pToken.type === INTERNAL_SUBSET_START_TOKEN) {
         badSubset = this.internalSubsetSeen || this.externalSubsetSeen;
      } else if (pToken.type === EXTERNAL_SUBSET_START_TOKEN) {
         badSubset = this.externalSubsetSeen;
      }

      if (newState && !badSubset) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         ec.report(WellFormedError.ID.TOKEN_INVALID_CONTEXT, [pToken.type], getFirstSToken(pToken));
      }
   }
}

export { DocumentChecker };
