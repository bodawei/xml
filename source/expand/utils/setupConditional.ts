import { defaultExtractors } from 'extractor';
import { TEXT_PTOKEN, ContextType, ParseValue } from 'pToken';
import { strOrBlank, STokenSource, toSToken } from 'sToken';
import { ParameterEntityReferencePToken, CHARREF_PTOKEN, EntityValuePToken } from 'token';
import { ConditionalInfo, ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityContextStack } from './EntityContextStack';

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
   entityContextStack: EntityContextStack,
   context: ContextType,
   deliverToken: (aToken: ParseValue, handled: () => void) => void,
   done: Done,
): void {
   addProtoReplacementText(ref, expandParams, entityContextStack, () => {
      const { utils } = expandParams;
      const entityName = strOrBlank(ref.name);
      const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
      const alreadyInEntity = entityContextStack.hasName(ref);

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

      const sTokenSource = new STokenSource(defaultExtractors, expandParams.entityId);
      sTokenSource.setConfVer(expandParams.confVer);
      const result: ConditionalInfo = {
         source: sTokenSource,
         textIsFinished: undefined,
         sectionType: toSToken(sectionTypeText),
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
}

export { setupConditional };
