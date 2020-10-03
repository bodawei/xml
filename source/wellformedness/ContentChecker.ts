/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, WellFormedError } from 'error';
import {
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CHARREF_PTOKEN,
   COMMENT_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   ElementEmptyPToken,
   ElementStartPToken,
   GeneralEntityStartPToken,
   getFirstSToken,
} from 'token';
import { PROCESSING_INSTRUCTION_PTOKEN, TEXTDECL_PTOKEN, ParseValue } from 'pToken';
import { strOrBlank } from 'sToken';
import {
   CHECKER_DONE,
   Checker,
   CheckState,
   scanAttributeValues,
   checkGeneralEntity,
} from './checkUtils';

enum State {
   PRE = 'PRE',
   ENTITY_START = 'ENTITY_START',
   CONTENT = 'CONTENT',
   DONE = 'DONE',
}

const NO_CHANGE = '---INTERNAL---MARKER---';

interface StateTable {
   [startState: string]: {
      [tokenType: string]: State | typeof NO_CHANGE;
   };
}

const WFID = WellFormedError.ID;

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
class ContentChecker implements Checker {
   private state: State;

   private start!: ElementStartPToken | ElementEmptyPToken | GeneralEntityStartPToken;

   private elementNameStack: Array<string> = [];

   private embeddedChecker?: ContentChecker;

   private checkState: CheckState;

   private geContext: Array<string>;

   constructor(checkState: CheckState, geContext: Array<string>) {
      this.checkState = checkState;
      this.state = State.PRE;
      this.geContext = [...geContext];
   }

   check(pToken: ParseValue, errorCollector: ErrorCollector): void | typeof CHECKER_DONE {
      if (this.state === State.PRE) {
         if (
            pToken.type !== ELEMENT_START_PTOKEN &&
            pToken.type !== ELEMENT_EMPTY_PTOKEN &&
            pToken.type !== GENERAL_ENTITY_START_PTOKEN
         ) {
            throw new Error(
               'Must first call check() with an element start, empty element or general entity start.',
            );
         }

         this.start = pToken;
      } else if (this.state === State.DONE) {
         throw new Error(
            'Internal error: Passed a token to ContentChecker when it was already done.',
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
         case ELEMENT_START_PTOKEN:
            const nameText = strOrBlank(pToken.name);
            this.elementNameStack.push(nameText);
            scanAttributeValues(
               pToken.attributes,
               this.checkState.generalDecls,
               this.checkState,
               this.geContext,
               errorCollector,
            );
            break;
         case ELEMENT_EMPTY_PTOKEN:
            scanAttributeValues(
               pToken.attributes,
               this.checkState.generalDecls,
               this.checkState,
               this.geContext,
               errorCollector,
            );
            break;
         case CHARDATA_PTOKEN:
            // §2.4.0: By dyntactic definition, ]]> may not appear in content:
            //    In the content of elements, character data is any string of characters which
            //    does not contain the start-delimiter of any markup and does not include the
            //    CDATA-section-close delimiter, "]]>".
            errorCollector.check(
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
               errorCollector.report(
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
            if (this.state !== State.PRE) {
               this.embeddedChecker = new ContentChecker(this.checkState, this.geContext);
               this.embeddedChecker.check(pToken, errorCollector);
               return;
            }

            const entityName = strOrBlank(pToken.referencePToken.name);

            if (entityName !== undefined) {
               errorCollector.check(
                  this.geContext.includes(entityName),
                  WellFormedError.ID.REFERENCE_INVALID_RECURSION,
                  [entityName],
                  pToken.referencePToken.open,
               );

               this.geContext.push(entityName);
            }

            checkGeneralEntity(
               pToken.referencePToken,
               false,
               this.checkState.generalDecls,
               this.checkState,
               errorCollector,
            );
            break;
         case GENERAL_ENTITY_END_PTOKEN:
            if (this.start && this.start.type === GENERAL_ENTITY_START_PTOKEN) {
               const startReferenceName = strOrBlank(this.start.referencePToken.name);
               const endReferenceName = strOrBlank(pToken.referencePToken.name);

               if (startReferenceName === endReferenceName) {
                  if (this.elementNameStack.length !== 0) {
                     const lastElement = this.elementNameStack[this.elementNameStack.length - 1];

                     // §4.3.2: (implicitly) the elements in an entity must be properly nested.
                     errorCollector.report(
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
            const refName = strOrBlank(pToken.name);

            if (refName !== undefined) {
               errorCollector.check(
                  this.geContext.includes(refName),
                  WellFormedError.ID.REFERENCE_INVALID_RECURSION,
                  [refName],
                  pToken.open,
               );
            }

            checkGeneralEntity(
               pToken,
               false,
               this.checkState.generalDecls,
               this.checkState,
               errorCollector,
            );
            break;
         default:
            break;
      }

      this.transition(pToken, errorCollector);

      if ((this.state as any) === State.DONE) {
         // typeHack - this.transition may change the state
         return CHECKER_DONE;
      }
   }

   /*
    * Given the specific PToken, transition in the state graph. Do any special casing as well
    * as just relying on the graph enumerated above.
    */
   private transition(pToken: ParseValue, ec: ErrorCollector): boolean {
      let newState: State | typeof NO_CHANGE = NO_CHANGE;

      if (pToken.type === GENERAL_ENTITY_START_PTOKEN && this.state === State.PRE) {
         const genEntityName = strOrBlank(pToken.referencePToken.name);
         const genEntityDecl = this.checkState.generalDecls[genEntityName];

         if (genEntityDecl && genEntityDecl.token.externalId) {
            newState = State.ENTITY_START;
         } else {
            newState = State.CONTENT;
         }
      } else {
         const transitions = transitionsByState[this.state];
         newState = transitions && transitions[pToken.type];
      }

      if (newState) {
         this.state = newState === NO_CHANGE ? this.state : newState;
      } else {
         ec.report(WFID.CONTENT_INVALID_TOKEN, [pToken.type], getFirstSToken(pToken));
      }

      return !!newState;
   }
}

export { ContentChecker };
