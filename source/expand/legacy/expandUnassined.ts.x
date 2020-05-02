import { EntityMetaData, isSpace, isName, isNmToken } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken, strOrBlank } from 'sToken';
import {
   CHARREF_PTOKEN,
   TEXT_PTOKEN,

   CharRefPToken,
   TextPToken,

   unassigned,
} from 'token';
import { UnassignedArray, UnassignedEndEntity, UnassignedType } from 'source/token/common/unassigned';
import { EntityValuePToken } from 'source/token/entityDeclaration';

import { ParameterEntityInfo, ParameterEntityMap } from './types';

type ExpandUnassignedProps = {
   isElementDecl: boolean,
   paramEntitiesByName: ParameterEntityMap,
   retrieveExternalEntity: (externalId: any, emd: EntityMetaData) => STokenSource,
   processForEntityValue: (sTokenSource: STokenSource, done: (result: EntityValuePToken) => void) => void,
   emd: EntityMetaData,
};

type Done = () => void;

function filterUncachedPEs(value: UnassignedArray | void, peByName: ParameterEntityMap): Array<ParameterEntityInfo> {
   const missingParameterEntities: Array<ParameterEntityInfo> = [];

   if (!value) {
      return missingParameterEntities;
   }

   for (let element of value) {
      if (element.type !== UnassignedType.REFERENCE) {
         continue;
      }

      const peRef = element.token;
      const peInfo = peByName[strOrBlank(peRef.name)];

      if (peInfo && !peInfo.unssignedCache) {
         missingParameterEntities.push(peInfo);
      }
   };

   return missingParameterEntities;
}

/*
 * Given an unassignedArray, look for all the PE References in it that we don't have values for,
 */
function retrieveExternalParameterEntities(missingParameterEntities: Array<ParameterEntityInfo>, props: ExpandUnassignedProps, done: Done) {
   const seeking: { [name: string]: boolean } = {};
   const sources = [];
   let seekingCount = 0;
   let retrieving= 0;

   for (let loopInfo of missingParameterEntities) {
      if (seeking[loopInfo.token.name!.str]) { // typeHack
         continue;
      }

      seekingCount++;
      seeking[loopInfo.token.name!.str] = true; // typeHack

      let sTokenSource: STokenSource;
      if (loopInfo.isInternal) {
         sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
         // Should add ranges
         loopInfo.token.value.forEach((element) => {
            switch (element.type) {
               case TEXT_PTOKEN:
                  const textEl = element as TextPToken;
                  sTokenSource.addText(textEl.text.str);
                  break;
               case CHARREF_PTOKEN:
                  const charRefEl = element as CharRefPToken;
                  const charRefXToken = charRefEl.toXToken();

                  if (charRefEl.digits) {
                     sTokenSource.addText(charRefXToken.char);
                  }
                  break;
            }
         });
         sTokenSource.endText();

         sources.push({
            source: sTokenSource,
            info: loopInfo,
         });
      } else {
         retrieving++;
         // this is the problem
         sTokenSource = props.retrieveExternalEntity(loopInfo.token.externalId!, props.emd);

         // Parse to an EntityValueParse
         props.processForEntityValue(sTokenSource, (entityValueParse) => {
            // Expand PERefs
            expandPERefsInEntityValue(entityValueParse, (expandedEntityValue) => {
               // Store in cache
               loopInfo.cache = expandedEntityValue;

               // Store text into an sTokenSource
               const sTokenSource = entityValueToSTokenSource(expandedEntityValue);

               sources.push({
                  source: sTokenSource,
                  info: loopInfo,
               });      
            });

            parseValuesAsUnassigned(sources, props, counters, done);
         });
      }
   }

   parseValuesAsUnassigned(sources, props, counters, done);
};


function parseValuesAsUnassigned(sources, props, counters, done) {
   if (counters.retrieving !== 0) {
      return;
   }

   sources.forEach(stuff => {
      unassigned.parseAllValues(stuff.source, props.isElementDecl, (results?: UnassignedArray) => {
         stuff.info.unssignedCache = results;
         counters.seekingCount--;

         if (counters.seekingCount === 0) {
            done();
         }
      });
   });
}

function expandUnassigned(value: UnassignedArray | void, props: ExpandUnassignedProps, deliverExpanded: (val: UnassignedArray | void) => void) {
   const missingParameterEntities = filterUncachedPEs(value, props.paramEntitiesByName);

   if (!value || missingParameterEntities.length === 0) {
      deliverExpanded(value);
      return;
   }

   retrieveExternalParameterEntities(missingParameterEntities, props, () => {
      let newUnassigned: UnassignedArray = [];

      for (let element of value) {
         if (element.type !== UnassignedType.REFERENCE) {
            newUnassigned.push(element);
         } else {
            const peRef = element.token;
            const peInfo = props.paramEntitiesByName[strOrBlank(peRef.name)];

            if (peInfo && peInfo.unssignedCache) {
               const start: UnassignedArray = [{
                  type: UnassignedType.ENTITY_START,
                  token: peRef,
               }];
               const end: UnassignedArray = [{
                  type: UnassignedType.ENTITY_END,
                  token: peRef,
               }];

               newUnassigned = newUnassigned.concat(start, peInfo.unssignedCache, end);
            } else {
               newUnassigned.push(element);
            }
         }
      };

      deliverExpanded(newUnassigned);
   });
}

export {
   expandUnassigned,
};
