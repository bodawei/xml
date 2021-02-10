import { defaultExtractors } from 'extractor';
import {
   ContextType,
   ParameterEntityReferencePToken,
   ParseToken,
   pTokenArrayToString,
} from 'pToken';
import { strOrBlank, STokenSource, toSToken } from 'sToken';

import { ConditionalInfo, ExpandParams } from '../types';
import { addProtoReplacementText } from './addProtoReplacementText';
import { EntityContextStack } from './EntityContextStack';

type Done = (result: ConditionalInfo) => void;

function setupConditional(
   ref: ParameterEntityReferencePToken,
   expandParams: ExpandParams,
   entityContextStack: EntityContextStack,
   context: ContextType,
   deliverToken: (aToken: ParseToken, handled: () => void) => void,
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

      const sectionTypeText = pTokenArrayToString(entityDetails.protoReplacementText).trim();

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
