import { defaultExtractors } from 'extractor';
import { ContextType } from 'pToken';
import { strOrBlank, STokenSource, toSToken } from 'sToken';
import {
   ParameterEntityReferencePToken,
   TEXT_PTOKEN,
   CHARREF_PTOKEN,
   PToken,
   EntityValuePToken,
} from 'token';
import { ConditionalInfo, ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityNameStack } from './EntityNameStack';

type Done = (result: ConditionalInfo) => void;

function extractType(replacementText: EntityValuePToken): string {
   let entityText = '';

   for (const element of replacementText) {
      if (element.type === TEXT_PTOKEN) {
         entityText += strOrBlank(element.text);
      } else if (element.type === CHARREF_PTOKEN) {
         entityText += element.char; // Reminder: It may be multiple utf16 codepoints
      }
   }

   return entityText.trim();
}

function setupConditional(
   ref: ParameterEntityReferencePToken,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   context: ContextType,
   deliverToken: (aToken: PToken, handled: () => void) => void,
   done: Done,
): void {
   addProtoReplacementText(ref, expandParams, nameStack, () => {
      const { utils } = expandParams;
      const entityName = strOrBlank(ref.name);
      const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
      const alreadyInEntity = nameStack.hasPEName(entityName);

      if (!entityDetails || !entityDetails.protoReplacementText) {
         done({});
         return;
      }

      const sectionTypeText = extractType(entityDetails.protoReplacementText);

      if (alreadyInEntity || sectionTypeText.toLocaleLowerCase() !== 'include') {
         done({
            sectionType: toSToken(sectionTypeText),
         });
         return;
      }

      const sTokenSource = new STokenSource(defaultExtractors, expandParams.entityId, expandParams.confVer);
      const result: ConditionalInfo = {
         source: sTokenSource,
         textIsFinished: undefined,
         sectionType: toSToken(sectionTypeText),
      };

      done(result);

      utils.parseBody(sTokenSource, context, expandParams.confVer, (nextToken, handled) => {
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
}

export { setupConditional };
