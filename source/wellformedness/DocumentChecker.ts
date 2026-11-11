/* Copyright ® 2019-2026 by 柏大衛. All rights reserved. */

import { PROBLEM, CONFORMANCE_VERSION, ENTITY_ID, Problem, ProblemCollector } from 'basic';
import {
   PROCESSING_INSTRUCTION_PTOKEN,
   XMLDECL_PTOKEN,
   ParseToken,
   isXmlDeclStandalone,
} from 'pToken';
import {
   COMMENT_PTOKEN,
   CONDITIONAL_START_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,
   SPACE_PTOKEN,
   getFirstSToken,
} from 'token';

import { checkMap } from './checkMap';
import {
   ContentChecker,
   MarkupChecker,
   ContentCheckerConstructor,
   MarkupCheckerConstructor,
   CheckState,
   CHECKER_DONE,
} from './checkUtils';
import { dtdEndCheck } from './common/dtdEndCheck';
import { WellFormedError, wellFormedErrorCodes } from './error/wellFormedError';
import { conditionalStartCheck } from './token/conditionalStartCheck';
import { docTypeEndCheck } from './token/docTypeEndCheck';

const NO_CHANGE = '---INTERNAL---MARKER---';

type StateTable = Record<string, Record<string, State | typeof NO_CHANGE> | undefined>;

interface CheckerMap {
   content: ContentCheckerConstructor;
   dtd: MarkupCheckerConstructor;
}

const WFEID = wellFormedErrorCodes.id;

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
      [COMMENT_PTOKEN]: State.PROLOG_LEADING_MISC,
      [DOCTYPE_START_PTOKEN]: State.PROLOG_IN_DOCTYPE,
      [ELEMENT_EMPTY_PTOKEN]: State.ELEMENT,
      [ELEMENT_START_PTOKEN]: State.ELEMENT,
      [PROCESSING_INSTRUCTION_PTOKEN]: State.PROLOG_LEADING_MISC,
      [SPACE_PTOKEN]: State.PROLOG_LEADING_MISC,
      [XMLDECL_PTOKEN]: State.PROLOG_LEADING_MISC,
   },
   [State.PROLOG_LEADING_MISC]: {
      [COMMENT_PTOKEN]: NO_CHANGE,
      [DOCTYPE_START_PTOKEN]: State.PROLOG_IN_DOCTYPE,
      [ELEMENT_EMPTY_PTOKEN]: State.ELEMENT,
      [ELEMENT_START_PTOKEN]: State.ELEMENT,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
   },
   [State.PROLOG_IN_DOCTYPE]: {
      [DOCTYPE_END_PTOKEN]: State.PROLOG_TRAILING_MISC,
      [SPACE_PTOKEN]: NO_CHANGE, // @@@ TEST
      // [EXTERNAL_SUBSET_START_TOKEN]: State.PROLOG_DTD,
   },
   [State.PROLOG_DTD]: {
      // exit this through below. Will transition to PROLOG_IN_DOCTYPE
   },
   [State.PROLOG_TRAILING_MISC]: {
      [COMMENT_PTOKEN]: NO_CHANGE,
      [ELEMENT_EMPTY_PTOKEN]: State.ELEMENT,
      [ELEMENT_START_PTOKEN]: State.ELEMENT,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [SPACE_PTOKEN]: NO_CHANGE,
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

   private subChecker?: ContentChecker | MarkupChecker;

   private checkers: CheckerMap;

   private internalSubsetSeen = false;

   private externalSubsetSeen = false;

   constructor(checkerMap: CheckerMap) {
      this.checkers = checkerMap;
   }

   check(pToken: ParseToken): ReadonlyArray<Problem> {
      const collector = new ProblemCollector(getFirstSToken(pToken), WellFormedError);

      if (pToken.type === CONFORMANCE_VERSION) {
         this.checkState.confVer = pToken;
         return [];
      } else if (pToken.type === ENTITY_ID) {
         return [];
      } else if (pToken.type === PROBLEM) {
         return [];
      }

      const mapped = checkMap[pToken.type];

      if (pToken.type === DOCTYPE_END_PTOKEN) {
         // Report errors with the starting context of the DOCTYPE start
         const specialErrorCollector = new ProblemCollector(
            pToken.docTypeStartPToken.open,
            WellFormedError,
         );
         docTypeEndCheck(pToken, specialErrorCollector);
         collector.appendFrom(specialErrorCollector);
         dtdEndCheck(this.checkState, collector);
      } else if (pToken.type === CONDITIONAL_START_PTOKEN) {
         conditionalStartCheck(pToken, collector);
      } else if (mapped) {
         mapped(pToken, collector, this.checkState.confVer, this.subChecker?.inSecondPassContxt);
      }

      if (this.subChecker) {
         const result = this.subChecker.check(pToken, collector);

         if (result === CHECKER_DONE) {
            if (this.state === State.ELEMENT) {
               this.state = State.TRAILING_MISC;
            } else if (this.state === State.PROLOG_IN_DOCTYPE) {
               this.state = State.PROLOG_TRAILING_MISC;
            } else {
               this.state = State.PROLOG_IN_DOCTYPE;
            }

            delete this.subChecker;
         }

         return collector.getProblems();
      }

      switch (pToken.type) {
         case XMLDECL_PTOKEN:
            if (this.state === State.START) {
               // §4.1.0: WFC Entiy Declared requires us to know if we're standalone
               this.checkState.isStandalone = isXmlDeclStandalone(pToken);
            }
            break;
         case DOCTYPE_START_PTOKEN:
            if (this.state === State.PROLOG_LEADING_MISC || this.state === State.START) {
               // §4.1.0: WFC Entiy Declared requires us to know what our DTD situation is
               this.checkState.hasNoDTD = !pToken.openSubset && !pToken.externalId;
               this.checkState.hasExternalDTD = !!pToken.externalId;

               this.transition(pToken, collector);
               if (pToken.openSubset) {
                  this.internalSubsetSeen = true;
               }

               if (pToken.externalId) {
                  this.externalSubsetSeen = true;
               }

               this.subChecker = new this.checkers.dtd(pToken, collector, this.checkState, []);
               return collector.getProblems();
            }
            break;
         // case EXTERNAL_SUBSET_START_TOKEN:
         //    this.transition(pToken, collector);
         //    this.externalSubsetSeen = true;

         //    if (this.state === State.PROLOG_DTD) {
         //       this.subChecker = new this.checkers.dtd(pToken, collector, this.checkState, []);
         //    }
         //    return;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            this.transition(pToken, collector);

            if (this.state === State.ELEMENT) {
               const checker = new this.checkers.content(pToken, collector, this.checkState, []);

               if (checker.isDone) {
                  this.state = State.TRAILING_MISC;
               } else {
                  this.subChecker = checker;
               }
            }
            return collector.getProblems();
         default:
            break;
      }

      this.transition(pToken, collector);

      return collector.getProblems();
   }

   public finish(): ReadonlyArray<Problem> {
      if (this.state !== State.TRAILING_MISC) {
         // might be nice to store the overall context and position so we can re-use it here.
         return [new WellFormedError(WFEID.DOC_END_EARLY, [], undefined, undefined)];
      }

      return [];
   }

   private transition(pToken: ParseToken, collector: ProblemCollector): void {
      const transitions = transitionsByState[this.state];
      const newState = transitions?.[pToken.type];
      let badSubset = false;

      if (pToken.type === DOCTYPE_START_PTOKEN) {
         badSubset = this.internalSubsetSeen || this.externalSubsetSeen;
         // } else if (pToken.type === EXTERNAL_SUBSET_START_TOKEN) {
         //    badSubset = this.externalSubsetSeen;
      }

      if (newState && !badSubset) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         collector.report(WFEID.TOKEN_INVALID_CONTEXT, [pToken.type], getFirstSToken(pToken));
      }
   }
}

export { DocumentChecker };
