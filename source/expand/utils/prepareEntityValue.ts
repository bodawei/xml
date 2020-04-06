/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import {
   EntityValuePToken,

   ParameterEntityReferencePToken,
   GeneralEntityReferencePToken,
} from 'token';

import { LoadingEmitter } from './LoadingEmitter';
import { expandEntityValue } from '../expandEntityValue';
import { ExpandParams } from '../types';

type DoneInfo = { errors: Array<Error> };
type Done = (result: DoneInfo) => void;

/*
 * 
 */
function prepareEntityValue(
      reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
      expandParams: ExpandParams,
      done: Done): void {
   const { geDeclCache, peDeclCache, utils, emd } = expandParams;
   const isPERef = reference instanceof ParameterEntityReferencePToken;
   const cache = isPERef ? peDeclCache : geDeclCache;
   const entityName = strOrBlank(reference.name);
   const entityInfo = entityName !== '' && cache[entityName];

   if (!entityInfo || entityInfo.isInternal || entityInfo.loading || entityInfo.valueCache) {
      const results = { errors: [] };
      if (entityInfo && entityInfo.loading) {
         entityInfo.loading.once('done', () => done(results));
      } else {
         done(results);
      }

      return;
   }

   const loading = new LoadingEmitter();
   const { sTokenSource, getErrors } =
      utils.retrieveExternalEntity(entityInfo.token.externalId!, emd);

   entityInfo.loading = loading;

   utils.parseEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken) => {
      expandEntityValue(entityValuePToken, expandParams, (expandedEntityValue) => {
         entityInfo.valueCache = expandedEntityValue;
         delete entityInfo.loading

         done({ errors: getErrors() });
         loading.emit('done');
      });
   });
}

export {
   prepareEntityValue,
};
