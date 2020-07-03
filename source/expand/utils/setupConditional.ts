import { ParameterEntityReferencePToken, TEXT_PTOKEN, CHARREF_PTOKEN, PToken } from 'token';
import { ConditionalInfo, ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityNameStack } from './EntityNameStack';
import { strOrBlank, STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';
import { ENTITY_META_DATA } from 'basic';

type Done = (result: ConditionalInfo) => void;

function setupConditional(
   ref: ParameterEntityReferencePToken,
   expandParams: ExpandParams,
   nameStack: EntityNameStack,
   inContent: boolean,
   deliverToken: (aToken: PToken) => void,
   done: Done,
): void {
   addProtoReplacementText(ref, expandParams, nameStack, () => {
      const { utils } = expandParams;
      const entityName = strOrBlank(ref.name);
      const entityDetails = expandParams.entityDetails.getPEDetails(entityName);
      const result: ConditionalInfo = {
         source: undefined,
      };
      let entityText = '';

      // Need to deal with nameStack

      if (!entityDetails || !entityDetails.protoReplacementText) {
         done(result);
         return;
      }

      for (const element of entityDetails.protoReplacementText) {
         if (element.type === TEXT_PTOKEN) {
            entityText += strOrBlank(element.text);
         } else if (element.type === CHARREF_PTOKEN) {
            entityText += String.fromCharCode(element.charCode);
         }
      }

      entityText = entityText.trim().toLocaleLowerCase();

      if (entityText !== 'include') {
         done(result);
         return;
      }

      const sTokenSource = new STokenSource(defaultExtractors, expandParams.emd);

      result.source = sTokenSource;
      result.callback = undefined;
      done(result);

      utils.parseBody(sTokenSource, inContent, (nextToken, handled) => {
         if (nextToken) {
            if (nextToken.type !== ENTITY_META_DATA) {
               deliverToken(nextToken);
            }
            handled();
            return;
         }

         handled();

         if (result.callback) {
            result.callback();
         }
      });
   });
}

export { setupConditional };
