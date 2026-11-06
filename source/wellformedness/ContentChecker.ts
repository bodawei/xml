/* Copyright ® 2019-2026 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import {
   CHARREF_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN,
   GeneralEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   ParseToken,
} from 'pToken';
import { strOrBlank } from 'basic';
import {
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   COMMENT_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   getFirstSToken,
} from 'token';

import {
   CHECKER_DONE,
   ContentStart,
   ContentChecker as IContentChecker,
   CheckState,
   scanAttributeValues,
   checkGeneralEntity,
} from './checkUtils';
import { Warning } from './error/warning';
import { warningCodes } from './error/warningCodes';
import { wellFormedErrorCodes } from './error/wellFormedError';

enum State {
   PRE = 'PRE',
   ENTITY_START = 'ENTITY_START',
   CONTENT = 'CONTENT',
   DONE = 'DONE',
}

const WFEID = wellFormedErrorCodes.id;
const NO_CHANGE = '---INTERNAL---MARKER---';

type StateTable = Record<string, Record<string, State | typeof NO_CHANGE> | undefined>;

const WFID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

const transitionsByState: StateTable = {
   [State.PRE]: {
      [GENERAL_ENTITY_START_PTOKEN]: State.ENTITY_START,
      [ELEMENT_START_PTOKEN]: State.CONTENT,
      [ELEMENT_EMPTY_PTOKEN]: State.DONE,
   },
   [State.ENTITY_START]: {
      [TEXTDECL_PTOKEN]: State.CONTENT, // §4.3.2: [78]
      [ELEMENT_START_PTOKEN]: State.CONTENT, // §3.0.0 [39], §3.1.0 [43], §4.3.2 [78],
      [ELEMENT_EMPTY_PTOKEN]: State.CONTENT,
      [ELEMENT_END_PTOKEN]: State.CONTENT,
      [CHARDATA_PTOKEN]: State.CONTENT,
      [CHARREF_PTOKEN]: State.CONTENT,
      [GENERAL_ENTITY_REFERENCE_PTOKEN]: State.CONTENT,
      [CDATA_PTOKEN]: State.CONTENT,
      [PROCESSING_INSTRUCTION_PTOKEN]: State.CONTENT,
      [COMMENT_PTOKEN]: State.CONTENT,
   },
   [State.CONTENT]: {
      [ELEMENT_START_PTOKEN]: NO_CHANGE, // §3.0.0 [39], §3.1.0 [43], §4.3.2 [78],
      [ELEMENT_EMPTY_PTOKEN]: NO_CHANGE,
      [ELEMENT_END_PTOKEN]: NO_CHANGE,
      [CHARDATA_PTOKEN]: NO_CHANGE,
      [CHARREF_PTOKEN]: NO_CHANGE,
      [GENERAL_ENTITY_REFERENCE_PTOKEN]: NO_CHANGE,
      [CDATA_PTOKEN]: NO_CHANGE,
      [PROCESSING_INSTRUCTION_PTOKEN]: NO_CHANGE,
      [COMMENT_PTOKEN]: NO_CHANGE,
   },
   [State.DONE]: {},
};

/*
 * This class checks well-formedness constraints on PTokens within a "content" portion of
 * an XML document (See §3.0.0 [39], §3.1.0 [43], §4.3.2 [78]).  This is separated from other
 * such checkers, of course, to help keep the logic in bite-sized pieces.
 *
 * This requires a particular usage pattern:
 * - It should be constructed with a set of data that keeps track of state across the
 *   whole parsing of a document.
 * - Thereafter, each PToken in the "stream" should be fed to this
 *   - errors, warnings and entity meta data should NOT be delivered).
 *   - The first PToken delivered should be ElementStart, ElementEmpty or GeneralEntityStart.
 *       - A GeneralEntityStart should only be passed by the recursive calls to this class.
 * - If this encounters the end of the expected series of PTokens, it will return CHECKER_DONE
 *   - if first PToken is an empty element
 *   - if an ElementEnd that balances the ElementStart is received.
 *   - if a GeneralEntityEnd is found that balances the opening one
 * - If a GeneralEntityStart is found, this will construct a new ContextChecker
 *   and then pass any tokens this is given to that until it indicates CHECKER_DONE
 */
class ContentChecker implements IContentChecker {
   private state: State;

   private start: ContentStart;

   private inIngernalGeRef: boolean;

   private elementNameStack: Array<string> = [];

   private embeddedChecker?: ContentChecker;

   private checkState: CheckState;

   private geContext: Array<string>;

   constructor(
      start: ContentStart,
      collector: Collector,
      checkState: CheckState,
      geContext: Array<string>,
   ) {
      this.checkState = checkState;
      this.state = State.PRE;
      this.geContext = [...geContext];
      this.start = start;
      this.inIngernalGeRef = false;

      if (start.type !== GENERAL_ENTITY_START_PTOKEN) {
         this.check(start, collector);
      } else {
         const entityName = strOrBlank(start.referencePToken.name);

         this.checkGERef(start.referencePToken, collector, true);

         const genEntityDecl = this.checkState.generalDecls[entityName];

         if (genEntityDecl?.token.externalId) {
            this.state = State.ENTITY_START;
         } else {
            this.state = State.CONTENT;
            this.inIngernalGeRef = true;
         }
      }
   }

   get isDone(): boolean {
      return this.state === State.DONE;
   }

   get inSecondPassContxt(): boolean {
      return this.inIngernalGeRef || (this.embeddedChecker?.inSecondPassContxt ?? false);
   }

   check(pToken: ParseToken, collector: Collector): undefined | typeof CHECKER_DONE {
      if (this.state === State.DONE) {
         throw new Error(
            'Internal error: Passed a token to ContentChecker when it was already done.',
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
         case ELEMENT_START_PTOKEN:
            const nameText = strOrBlank(pToken.name);
            this.elementNameStack.push(nameText);
            scanAttributeValues(
               pToken.attributes,
               this.checkState.generalDecls,
               this.checkState,
               this.geContext,
               collector,
            );
            break;
         case ELEMENT_EMPTY_PTOKEN:
            // §3.1: For interoperability, the empty-element tag should be
            //    used, and should only be used, for elements which are declared EMPTY.
            const emptyName = strOrBlank(pToken.name);
            if (this.checkState.elementDecl[emptyName] !== 'EMPTY') {
               collector.reportProblem(
                  Warning,
                  WID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
                  [emptyName],
                  pToken.open,
               );
            }

            scanAttributeValues(
               pToken.attributes,
               this.checkState.generalDecls,
               this.checkState,
               this.geContext,
               collector,
            );
            break;
         case CHARDATA_PTOKEN:
            // §2.4.0: By dyntactic definition, ]]> may not appear in content:
            //    In the content of elements, character data is any string of characters which
            //    does not contain the start-delimiter of any markup and does not include the
            //    CDATA-section-close delimiter, "]]>".
            collector.check(
               strOrBlank(pToken.text) === ']]>',
               WFID.CHARDATA_INVALID_SECTION_END,
               [],
               pToken.text,
            );
            break;
         case ELEMENT_END_PTOKEN:
            const endNameText = strOrBlank(pToken.name);
            const lastElement = this.elementNameStack[this.elementNameStack.length - 1];

            // §3.0.0: Well-Formedness Constraint: Element Type Match
            //    The Name in an element's end-tag must match the element type in the start-tag.
            // Also production [39] says that start and end must match within the same entity.
            if (lastElement !== endNameText) {
               collector.report(
                  WFID.ELEMENT_UNBALANCED,
                  [lastElement || '', endNameText],
                  pToken.open,
               );
            } else {
               this.elementNameStack.pop();

               if (this.elementNameStack.length === 0 && this.start.type === ELEMENT_START_PTOKEN) {
                  this.state = State.DONE;
                  return CHECKER_DONE;
               }
            }
            break;
         case GENERAL_ENTITY_START_PTOKEN:
            this.embeddedChecker = new ContentChecker(
               pToken,
               collector,
               this.checkState,
               this.geContext,
            );
            return;
         case GENERAL_ENTITY_END_PTOKEN:
            if (this.start.type === GENERAL_ENTITY_START_PTOKEN) {
               const startReferenceName = strOrBlank(this.start.referencePToken.name);
               const endReferenceName = strOrBlank(pToken.referencePToken.name);

               if (startReferenceName === endReferenceName) {
                  if (this.elementNameStack.length !== 0) {
                     const lastElement = this.elementNameStack[this.elementNameStack.length - 1];

                     // §4.3.2: (implicitly) the elements in an entity must be properly nested.
                     collector.report(
                        WFID.ELEMENT_UNBALANCED,
                        [lastElement, pToken.type],
                        pToken.referencePToken.open,
                     );
                  }

                  this.state = State.DONE;
                  return CHECKER_DONE;
               }
            }
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.checkGERef(pToken, collector, false);
            break;
         default:
            break;
      }

      this.transition(pToken, collector);

      // @ts-expect-error ts2367 this.transition may change the state
      if (this.state === State.DONE) {
         return CHECKER_DONE;
      }
   }

   checkGERef(
      pToken: GeneralEntityReferencePToken,
      collector: Collector,
      addToContext: boolean,
   ): void {
      const refName = strOrBlank(pToken.name);

      if (refName !== '') {
         collector.check(
            this.geContext.includes(refName),
            WFEID.REFERENCE_INVALID_RECURSION,
            [refName],
            pToken.open,
         );

         if (addToContext) {
            this.geContext.push(refName);
         }
      }

      checkGeneralEntity(pToken, false, this.checkState.generalDecls, this.checkState, collector);
   }

   /*
    * Given the specific PToken, transition in the state graph. Do any special casing as well
    * as just relying on the graph enumerated above.
    */
   private transition(pToken: ParseToken, collector: Collector): boolean {
      let newState: undefined | State | typeof NO_CHANGE = NO_CHANGE;

      const transitions = transitionsByState[this.state];

      newState = transitions?.[pToken.type];

      if (newState) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         collector.report(WFID.CONTENT_INVALID_TOKEN, [pToken.type], getFirstSToken(pToken));
      }

      return !!newState;
   }
}

export { ContentChecker };
