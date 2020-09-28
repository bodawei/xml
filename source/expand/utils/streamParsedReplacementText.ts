/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ContextType, externalIdToEntityId } from 'pToken';
import { STokenSource } from 'sToken';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
   PToken,
   XmlError,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
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
import { EntityContextStack } from './EntityContextStack';

type DeliverToken = (result: PToken | void, handled: () => void) => void;

function deliverMultipleTokens(
   allTokens: Array<PToken | void>,
   deliverToken: (result: PToken | void, callback: () => void) => void,
   allDone: () => void,
): void {
   function process(): void {
      const next = allTokens.shift();

      if (next === undefined) {
         deliverToken(next, allDone);
      } else {
         deliverToken(next, process);
      }
   }

   process();
}

function noop(): void {}

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
   entityContextStack: EntityContextStack,
   deliverToken: DeliverToken,
): void {
   const { entityDetails, utils } = expandParams;
   let sTokenSource: STokenSource;
   let getErrors: () => Array<XmlError>;
   let context = ContextType.DOCUMENT;
   let start: PToken;
   let end: PToken;
   let entityLoc = entityContextStack.getCurrentEntityLoc();

   if (!expandParams.loadExternalEntities) {
      deliverToken(undefined, noop);
      return;
   }

   if (reference.type === EXTERNAL_DTD_PSEUDO_TOKEN) {
      // It may be strange to treat the reference the same as a declaration, but for the externalId
      // the reference pseudo token also acts as a declaration of sorts.
      const entityId = externalIdToEntityId(reference.externalId);
      entityLoc = expandParams.utils.resolveEntityId(
         entityContextStack.getCurrentEntityLoc(),
         entityId,
      );
      ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(entityLoc));
      context = ContextType.EXTERNAL_SUBSET;
      start = new ExternalSubsetStartToken();
      end = new ExternalSubsetEndToken();
   } else {
      if (reference.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         start = new GeneralEntityStartPToken(reference);
         end = new GeneralEntityEndPToken(reference);
         context = ContextType.GENERAL_ENTITY;
      } else {
         start = new ParameterEntityStartPToken(reference);
         end = new ParameterEntityEndPToken(reference);
         context = ContextType.PARAMETER_ENTITY;
      }

      const details = entityDetails.getReferencedDetails(reference);

      if (!details) {
         deliverToken(undefined, noop);
         return;
      }

      entityLoc = details.entityLoc;

      if (details.protoReplacementText) {
         sTokenSource = entityValueToSTokenSource(
            details.protoReplacementText,
            expandParams.entityId,
         );
         getErrors = (): Array<XmlError> => [];
      } else {
         ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(entityLoc));
      }
   }

   entityContextStack.pushName(reference, entityLoc);
   deliverToken(start, () => {
      sTokenSource.setConfVer(expandParams.confVer);
      utils.parseBody(sTokenSource, context, (result, handled) => {
         if (!result) {
            entityContextStack.popName(reference);
            deliverMultipleTokens([...getErrors(), end, undefined], deliverToken, handled);
            return;
         }

         deliverToken(result, handled);
      });
   });
}

export { streamParsedReplacementText };
