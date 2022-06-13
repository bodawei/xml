import { ParseType, ParseToken } from 'pToken';
import { STokenSource, strOrBlank } from 'basic';
import { ConditionalStartPToken, resumeParseConditional } from 'token';

import { ConditionalInfo, ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { EntityContextStack } from './EntityContextStack';

type Done = (result: ConditionalInfo) => void;

function setupConditional(
   token: ConditionalStartPToken,
   expandParams: ExpandParams,
   entityContextStack: EntityContextStack,
   context: ParseType,
   deliverToken: (aToken: ParseToken, handled: () => void) => void,
   done: Done,
): void {
   const ref = token.unexpanded?.peRef;

   if (!ref) {
      done({});
      return;
   }

   // This is not safe, in an absolute sense, as this could be gigantic.
   addProtoReplacementText(ref, expandParams, entityContextStack, () => {
      const { utils } = expandParams;
      const entityName = strOrBlank(ref.name);
      const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
      const alreadyInEntity = entityContextStack.hasName(ref);

      /*
      - Posibility 1: the parameter entity provides just the INCLUDE
         - add that
         - return incomplete conditional
            - if INCLUDE caller will need to feed text ptokens in to finish and then parseBody
            - if IGNORE can just ignore
      - possibliity 2 pe includes include and [
           - add that conditional
           - return conditional (done)
            - and let  next text processing go through parsebody
      - paossibility 3: pe has include, [ and more
            - populate the conditional;
           - return conditional (done)
            - pull contents of stokensource out and put into the new that is getting stokens.


         What does this do?  this only handles the initial PRef (in case 3, not even completely)
         This also decides on whether there is more work to do:
            Another routine (or this one) sets up the parseBody processing and handoff.

            OK, this populates the conditional as far as it can:
               returns
                  - incomplete or complete conditional
                  - stoken source (perhaps with stuff already in it
                  - sets up processor for incomplete cases to finish the token.
            Caller
                 - if incomplete, does not return the token, but says it is done.
                  - adds more text to the source

            if incomplete, have to wait for more text to finish.


            CalledWith
                     startToken
                     expandParams
                     contextStack
                     state
                     CB
                        newStart
                        remainderSTokenSource?
            If ignore, just do nothing.
            If include 
               signal done (maybe pass back token or not)
               call processSubContext
                     param: tokenCallBack

            conditionalProcessPeRef
               Four outcomes
                           COND FULL              COND INCOMPLETE
               PEREF       (no peref)             set up special processing mode 
               CONSUMED    Deliver cond           which finishes cond then <continue>
                           set up condStack       Signal done with cond (but don't sent)
                           (either include        set up resumeParse of conditional
                              or ignore)              When that done, move to lower-left
                           <continue>

               PEREF       deliver cond           deliver cond
               HAS         set up condStack       set up condStack
               DATA        (either include        (either include
                               or ignore)             or ignore)
                           <continue>             <continue>
       */

      if (!entityDetails || !entityDetails.protoReplacementText) {
         done({});
         return;
      }

      let sTokenSource = entityValueToSTokenSource(
         entityDetails.protoReplacementText,
         expandParams.entityId,
         false,
      );

      resumeParseConditional(sTokenSource, token, (newToken) => {
         const sectionType = strOrBlank(newToken.sectionType);

         sTokenSource = new STokenSource(expandParams.entityId);
         sTokenSource.setConfVer(expandParams.confVer);

         if (alreadyInEntity || sectionType.toLocaleLowerCase() !== 'include') {
            done({
               newStart: newToken,
            });
            return;
         }

         const result: ConditionalInfo = {
            source: sTokenSource,
            textIsFinished: undefined,
            newStart: newToken,
         };

         done(result);

         utils.parseBody(sTokenSource, context, (nextToken, handled) => {
            if (nextToken) {
               deliverToken(nextToken, handled);
               return;
            }

            result.source = undefined;
            handled();

            if (result.textIsFinished) {
               result.textIsFinished();
            }
         });
      });
   });
}

export { setupConditional };
