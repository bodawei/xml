/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { STokenSource, strOrBlank } from 'basic';
import { ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { ConditionalStartPToken, resumeParseConditional } from 'token';
import { addProtoReplacementText } from './addProtoReplacementText';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { ExpandParams } from '../types';
import { EntityContextStack } from './EntityContextStack';

type ProcessingResult =
   | { done: false; hack: ConditionalStartExpander }
   | { done: true; newStart: ConditionalStartPToken; extraText: STokenSource };

type Done = (result: ProcessingResult) => void;
type PTokenExpanded = () => void;

class ConditionalStartExpander {
   private start: ConditionalStartPToken;

   private entityContextStack: EntityContextStack;

   private source: STokenSource;

   private expandParams: ExpandParams;

   private done: Done;

   constructor(
      conditionalStart: ConditionalStartPToken,
      expandParams: ExpandParams,
      entityContextStack: EntityContextStack,
      done: Done,
   ) {
      const unexpanded = conditionalStart.unexpanded;

      this.expandParams = expandParams;
      this.entityContextStack = entityContextStack;
      this.start = conditionalStart;
      this.source = new STokenSource();
      this.done = done;

      if (!unexpanded) {
         done({ done: true, newStart: conditionalStart, extraText: this.source });
         return;
      }

      this.handleInitialPeRef(unexpanded.peRef, done);
   }

   /*
    * Process a PToken
    * In the general case, after finding an unexpanded ConditionalStart, we would
    * expect to receive
    *   - TextPToken which are just runs of text and "<[" and "]]>" values.
    *     - Process these according to our current state
    *   - ConditionalEndPToken (our own end)
    *     - Terminate our processing and pass along
    *   - Internal subset end, external subset start or end or theoretically doctype end
    *     - Terminate our processing and pass along
    *   - errors
    *     - Pass along
    *   - other
    *     - This shouldn't happen, but if it does, we terminate and pass along
    */
   public expandPToken(pToken: TextPToken, expanded: PTokenExpanded): void {
      this.source.addText(pToken.text.str); // eeek

      this.resumeInitalParse(false);
      expanded();
   }

   public finish(): void {
      this.done({ done: true, newStart: this.start, extraText: this.source });
   }

   private handleInitialPeRef(peRef: ParameterEntityReferencePToken, done: Done) {
      addProtoReplacementText(peRef, this.expandParams, this.entityContextStack, () => {
         const entityName = strOrBlank(peRef.name);
         const entityDetails = this.expandParams.entityDetails.getPEDetails(entityName);
         // const alreadyInEntity = this.entityContextStack.hasName(peRef);

         if (!entityDetails?.protoReplacementText) {
            done({ done: true, newStart: this.start, extraText: this.source });
            return;
         }

         this.source = entityValueToSTokenSource(
            entityDetails.protoReplacementText,
            this.expandParams.entityId,
            false,
         );
         this.source.setConfVer(this.expandParams.confVer);

         this.resumeInitalParse(true);
      });
   }

   /*
    * After queueing up some data to be read, resume parsing the conditional start.
    * Recall that we might be in any of these situations when we call resumeParse
    *    <![
    *    <![ S
    *    <![ S WORD
    *    <![ S WORD S
    * Once we have done the parse, we will be in one of four conditions:
    *
    *           CONDITIONAL HAS BRACKET          COND INCOMPLETE
    * SOURCE    (1) Deliver conditionalStart     (2) We might need more text
    * EMPTY         Set up condStack                 Continue initial processing
    *               Continue processing
    *
    * SOURCE    (3) Deliver conditionalStart     (4) Deliver conditionalStart
    * HAS TEXT      Set up condStack                 Set up condStack
    *               Continue processing              Continue processing
    *                                                (this is like "<![ FOO blah")
    *
    * Note that in a situation like "<![ %DOIT; [", we are most likely to end up
    * in state 2 first, and then state 3.
    * This whole process seems really complex. It is needed to deal with
    * things like: "<![ %SPACE; %SPACE; %SPACE; %VALUE; %SPACE; [" (valid and wellformed)
    * as well as: "<![ %VALUE_WITH_BRACKET; blah" (not valid, but evidently wellformed)
    */
   private resumeInitalParse(inPERef: boolean): void {
      resumeParseConditional(this.source, this.start, (newToken) => {
         this.start = newToken;

         if (this.start.bracket || !this.source.ended()) {
            let newStart: ConditionalStartPToken = this.start;

            this.source.continueText(); // eek

            if (inPERef && this.start.bracket && newToken.unexpanded) {
               newStart = {
                  ...newToken,
                  unexpanded: {
                     includedBracket: true,
                     peRef: newToken.unexpanded.peRef,
                     propName: newToken.unexpanded.propName,
                     secondPropName: newToken.unexpanded.secondPropName,
                  },
               };
            }
            this.done({ done: true, extraText: this.source, newStart });
         } else {
            this.source.continueText(); // eek
            this.done({ done: false, hack: this });
         }
      });
   }
}

export { ConditionalStartExpander };
