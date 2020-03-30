import { EntityMetaData } from 'basic';
import { STokenSource, strOrBlank } from 'sToken';
import {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,

   EntityValuePToken,

   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
} from 'token';

import { EntityProcessors, ParameterEntityInfo, ParameterEntityMap } from './types';

type ExpandParams = {
   entityCache: ParameterEntityMap,
   utils: EntityProcessors,
   emd: EntityMetaData,
};

type Done = (errors: Array<Error>) => void;

/*
 * Simply sweep through an EntityValuePToken and return any ParameterEntityInfo's
 * found that do not already have a cached EntityValuePToken value.
 */
function findUncachedEntities(value: EntityValuePToken, entityCache: ParameterEntityMap): Array<ParameterEntityInfo> {
   const uncachedEntities: Array<ParameterEntityInfo> = [];

   for (let subToken of value) {
      if (subToken.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         const elementName = strOrBlank(subToken.name);
         const peInfo = elementName !== '' && entityCache[elementName];

         if (peInfo && !peInfo.isInternal && !peInfo.valueCache) {
            uncachedEntities.push(peInfo);
         }
      }
   };

   return uncachedEntities;
}

/*
 * Go through a set of ParameterEntityInfo that are known not to have a valueCache value,
 * retrieve those entity strings, and parse them into EntityValuePTokens.  Then, modify
 * the expandParams.entityCache entries for those entities.
 */
function populateMissingEntities(
      missingParameterEntities: Array<ParameterEntityInfo>,
      expandParams: ExpandParams,
      done: Done): void {
   type SeekingMap = { [name: string]: boolean };
   const { utils, emd } = expandParams;
   const seeking: SeekingMap = {};
   let seekingCount = missingParameterEntities.length;
   let foundSomeToSeek = false;
   const errors: Array<Error> = [];

   for (let entityInfo of missingParameterEntities) {
      if (seeking[entityInfo.name]) {
         seekingCount --;

         if (seekingCount === 0) {
            done(errors);
         }
         continue;
      }

      foundSomeToSeek = true;
      seeking[entityInfo.name] = true;

      const sTokenSource: STokenSource =
         utils.retrieveExternalEntity(entityInfo.token.externalId!, emd);

      utils.processForEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken) => {
         expandEntityValue(entityValuePToken, expandParams, (expandedEntityValue) => {
            entityInfo.valueCache = expandedEntityValue;
            seekingCount --;

            errors.push(...sTokenSource.errors);
            
            if (seekingCount === 0) {
               done(errors);
            }
         });
      });
   }

   if (!foundSomeToSeek) {
      done(errors);
   }
};

/*
 * Given an entity value (either general or parameter) (which is, for reminder, a collection
 * of text, charRef, parameter entity references, and param entity start/stop tokens),  examine
 * all the references and replace them with start/stop pairs and the contents of the referenced
 * tokens.  Return a copy of the expanded value along with any errors that might have happend
 * while doing that.
 * 
 * Note: This will modify the epandParams.entityCache.*.valueCache with the EntityValuePTokens
 * of any external parameter entities that this retrieved.
 */
function expandEntityValue(
      value: EntityValuePToken,
      expandParams: ExpandParams,
      expanded: (newValue: EntityValuePToken, errors: Array<Error>) => void) {
   const { entityCache } = expandParams;
   const missingEntities = findUncachedEntities(value, entityCache);

   populateMissingEntities(missingEntities, expandParams, (errors: Array<Error>) => {
      let newValue: EntityValuePToken = [];

      for (let element of value) {
         if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
            const entryName = strOrBlank(element.name);
            const peInfo = entryName === '' ? undefined : entityCache[entryName];

            if (peInfo) {
               newValue.push(new ParameterEntityStartPToken(element));
               newValue = newValue.concat(peInfo.valueCache || []);
               newValue.push(new ParameterEntityEndPToken(element));
               continue;
            }
         }

         newValue.push(element);
      };

      expanded(newValue, errors);
   });
}


export {
   ExpandParams, 
   expandEntityValue,
};
