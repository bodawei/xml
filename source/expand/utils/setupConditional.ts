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
import { strOrBlank, STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';
import { ENTITY_META_DATA } from 'basic';

type Done = (result: ConditionalInfo) => void;

function valueIsNotInclude(replacementText: EntityValuePToken): boolean {
   let entityText = '';

   for (const element of replacementText) {
      if (element.type === TEXT_PTOKEN) {
         entityText += strOrBlank(element.text);
      } else if (element.type === CHARREF_PTOKEN) {
         entityText += element.char; // Reminder: It may be multiple utf16 codepoints
      }
   }

   entityText = entityText.trim().toLocaleLowerCase();

   return entityText !== 'include';
}

function setupConditional(
   ref: ParameterEntityReferencePToken,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   inContent: boolean,
   deliverToken: (aToken: PToken, handled: () => void) => void,
   done: Done,
): void {
   addProtoReplacementText(ref, expandParams, nameStack, () => {
      const { utils } = expandParams;
      const entityName = strOrBlank(ref.name);
      const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
      const alreadyInEntity = nameStack.hasPEName(entityName);

      if (
         !entityDetails ||
         !entityDetails.protoReplacementText ||
         alreadyInEntity ||
         valueIsNotInclude(entityDetails.protoReplacementText)
      ) {
         done({});
         return;
      }

      const sTokenSource = new STokenSource(defaultExtractors, expandParams.emd);
      const result: ConditionalInfo = {
         source: sTokenSource,
         textIsFinished: undefined,
      };

      done(result);

      utils.parseBody(sTokenSource, inContent, (nextToken, handled) => {
         if (nextToken) {
            if (nextToken.type !== ENTITY_META_DATA) {
               deliverToken(nextToken, handled);
            } else {
               handled();
            }
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
