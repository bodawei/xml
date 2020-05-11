/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank, STokenSource } from 'sToken';
import {
   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
   PToken,
   XmlError,
} from 'token';

import {
   EXTERNAL_DTD_PSEUDO_TOKEN,
   ExternalDtdSubsetPseudoToken,
} from './ExternalDtdSubsetPseudoToken';
import { entityValueToSTokenSource } from './entityValueToSTokenSource';
import { ExpandParams } from '../types';

type DeliverToken = (result: PToken | void, handled: () => void) => void;

/*
 * Given an entity reference, make sure the referenced entity is in the cache,
 * and recursively retrieve any PE entities it's value references.
 * The entity, and all of its referenced entities are not guaranteed to have been
 * populated by the time this returns, since in some cases the entities may not be
 * locatable.
 */
function streamEntityReference(
   reference:
      | ParameterEntityReferencePToken
      | GeneralEntityReferencePToken
      | ExternalDtdSubsetPseudoToken,
   expandParams: ExpandParams,
   deliverToken: DeliverToken,
): void {
   const { geDeclCache, peDeclCache, utils, emd } = expandParams;
   let sTokenSource: STokenSource;
   let getErrors: () => Array<XmlError>;
   let inContent = true;

   if (reference.type === EXTERNAL_DTD_PSEUDO_TOKEN) {
      ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         reference.externalId!,
         emd,
      ));
      inContent = false;
   } else {
      const isPERef = reference instanceof ParameterEntityReferencePToken;
      const cache = isPERef ? peDeclCache : geDeclCache;
      const entityName = strOrBlank(reference.name);
      const entityInfo = entityName !== '' && cache[entityName];

      if (!entityInfo) {
         deliverToken(undefined, (): void => {
            // do nothing
         });
         return;
      }

      if (entityInfo.valueCache) {
         sTokenSource = entityValueToSTokenSource(entityInfo.valueCache, expandParams.emd);
         getErrors = (): Array<XmlError> => [];
      } else {
         ({ sTokenSource, getErrors } = utils.retrieveExternalEntity(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            entityInfo.token.externalId!,
            emd,
         ));
      }
   }

   utils.parseBody(sTokenSource, inContent, (result, handled) => {
      if (!result) {
         const errors = getErrors();
         for (const err of errors) {
            deliverToken(err, () => {
               // do nothing
            });
         }
      }
      deliverToken(result, handled);
   });
}

export { streamEntityReference };
