/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { STokenSource } from 'sToken';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
   PToken,
   XmlError,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
} from 'token';

import {
   EXTERNAL_DTD_PSEUDO_TOKEN,
   ExternalDtdSubsetPseudoToken,
} from './ExternalDtdSubsetPseudoToken';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { ExpandParams } from '../types';

type DeliverToken = (result: PToken | void, handled: () => void) => void;

function deliverMultipleTokens(
   allTokens: Array<PToken | void>,
   deliverToken: (result: PToken | void, callback: () => void) => void,
): void {
   function process(): void {
      const next = allTokens.shift();

      if (next === undefined) {
         deliverToken(next, (): void => {
            /* do nothing */
         });
      } else {
         deliverToken(next, process);
      }
   }

   process();
}

/*
 * Given an entity reference, retrieve its value, and start parsing that
 * delivering each token as it is found to the caller. When no more
 * PTokens are found, pass undefined to the caller.
 * The caller must acknowledge each token before the next is sent
 */
function streamParsedReplacementText(
   reference:
      | ParameterEntityReferencePToken
      | GeneralEntityReferencePToken
      | ExternalDtdSubsetPseudoToken,
   expandParams: ExpandParams,
   deliverToken: DeliverToken,
): void {
   const { entityDetails, utils, emd } = expandParams;
   let sTokenSource: STokenSource;
   let getErrors: () => Array<XmlError>;
   let inContent = true;
   let start: PToken;
   let end: PToken;

   if (!expandParams.loadExternalEntities) {
      deliverToken(undefined, (): void => {
         // do nothing
      });
      return;
   }

   if (reference.type === EXTERNAL_DTD_PSEUDO_TOKEN) {
      ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(reference.externalId, emd));
      inContent = false;
      start = new ExternalSubsetStartToken();
      end = new ExternalSubsetEndToken();
   } else {
      if (reference.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         start = new GeneralEntityStartPToken(reference);
         end = new GeneralEntityEndPToken(reference);
         inContent = true;
      } else {
         start = new ParameterEntityStartPToken(reference);
         end = new ParameterEntityEndPToken(reference);
         inContent = false;
      }

      const details = entityDetails.getReferencedDetails(reference);

      if (!details) {
         deliverToken(undefined, (): void => {
            // do nothing
         });
         return;
      }

      if (details.protoReplacementText) {
         sTokenSource = entityValueToSTokenSource(details.protoReplacementText, expandParams.emd);
         getErrors = (): Array<XmlError> => [];
      } else {
         ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            details.token.externalId!,
            emd,
         ));
      }
   }

   deliverToken(start, () => {
      utils.parseBody(sTokenSource, inContent, (result, handled) => {
         if (!result) {
            deliverMultipleTokens([...getErrors(), end, undefined], deliverToken);
            return;
         }

         deliverToken(result, handled);
      });
   });
}

export { streamParsedReplacementText };
