/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */

import { EntityLocation, EntityMetaData, EntityKind } from '../basic';
import { defaultExtractors } from '../extractor';
import { SToken, STokenSource } from '../sToken';
import {
   entityDeclaration,
   text,
} from '../token';
import { EntityDeclaration } from '../token/entityDeclaration';

type EntityMap = {
   [name: string]: any,
};

const DEFAULT_ENTITY = 'DefaultEntity';
const INTERNAL_SUBSET = 'EntityDeclaredInInternalSubset';
const EXTERNAL_SUBSET = 'EntityDeclaredInExternalSubset';

/**********************************************************************\
  A cache of available entities.
  It includes the five default entities pre-added.
\**********************************************************************/

class EntityManager {
   private _entityMap: EntityMap;
   private _externalEntityLocation?: EntityLocation;

   constructor() {
      this._entityMap = {};

      const ltEntity = new entityDeclaration.XToken('lt',
         [ new text.PToken({ text: SToken.fromString('&#60;') }) ], undefined, undefined, []);
      const gtEntity = new entityDeclaration.XToken('gt',
         [ new text.PToken({ text: SToken.fromString('>') }) ], undefined, undefined, []);
      const ampEntity = new entityDeclaration.XToken('amp',
         [ new text.PToken({ text: SToken.fromString('&#38;') }) ], undefined, undefined, []);
      const aposEntity = new entityDeclaration.XToken('apos',
         [ new text.PToken({ text: SToken.fromString('\'') }) ], undefined, undefined, []);
      const quotEntity = new entityDeclaration.XToken('quot',
         [ new text.PToken({ text: SToken.fromString('"') }) ], undefined, undefined, []);

      this._internalAdd(ltEntity, DEFAULT_ENTITY, false);
      this._internalAdd(gtEntity, DEFAULT_ENTITY, false);
      this._internalAdd(ampEntity, DEFAULT_ENTITY, false);
      this._internalAdd(aposEntity, DEFAULT_ENTITY, false);
      this._internalAdd(quotEntity, DEFAULT_ENTITY, false);
   }

   addEntityFromInternalSubset(entityDeclarationToken: EntityDeclaration) {
      this._internalAdd(entityDeclarationToken, INTERNAL_SUBSET, false);
   }

   addEntityFromExternalSubset(entityDeclarationToken: EntityDeclaration) {
      this._internalAdd(entityDeclarationToken, EXTERNAL_SUBSET, false);
   }

   addParameterEntityFromInternalSubset(entityDeclarationToken: EntityDeclaration) {
      this._internalAdd(entityDeclarationToken, INTERNAL_SUBSET, true);
   }

   addParameterEntityFromExternalSubset(entityDeclarationToken: EntityDeclaration) {
      this._internalAdd(entityDeclarationToken, EXTERNAL_SUBSET, true);
   }

   /**********************************************************************\
    getEntity() returns an STokenSource with the contents of the requested
    general entity, or undefined if there is no such entity present.
   \**********************************************************************/

   getEntity(name: string) {
      return this._internalGet(name, false);
   }

   getParameterEntity(name: string) {
      return this._internalGet(name, true);
   }

   getEntityToken(name: string) {
      return this._internalGetToken(name, false);
   }

   getParameterEntityToken(name: string) {
      return this._internalGetToken(name, true);
   }

   getEntityInfo(name: string) {
      return this._internalGetInfo(name, false);
   }

   getParameterEntityInfo(name: string) {
      return this._internalGetInfo(name, true);
   }

   /**********************************************************************\
    setExternalSubsetEntity() Adds the specified EntityLocation as the
    location of the external subset entity.
   \**********************************************************************/

   setExternalSubsetEntity(entityLocation: EntityLocation) {
      this._externalEntityLocation = entityLocation;
   }

   /**********************************************************************\
    getExternalSubsetEntity() Retrieves a STokenSource for the external
    subset entity, or returns undefiend if none has been specified.
   \**********************************************************************/

   getExternalSubsetEntity() {
      if (!this._externalEntityLocation) {
         return;
      }

      const source = new STokenSource(defaultExtractors as any, // typeHack
         new EntityMetaData(EntityKind.EXTERNALSUBSET, undefined, undefined, this._externalEntityLocation));
      return source;
   }

   /**********************************************************************\
    _internalAdd() adds the specified general or parameter entity
    information
   \**********************************************************************/

   _internalAdd(token: EntityDeclaration, source: string, isParameter: boolean) {
      if (!token || !(token instanceof entityDeclaration.XToken)) {
         throw new Error('Must call with an entity declaration token.');
      }

      if (!this._entityMap[token.name]) {
         this._entityMap[token.name] = new EntityEntry();
      }

      this._entityMap[token.name].addEntity(token, isParameter, source);
   }

   /**********************************************************************\
    _internalGet() retrieves the specified entity (or returns undefined).
    It tives precedence to the internal entity declarations over the
    external over the default ones.
   \**********************************************************************/

   _internalGet(name: string, isParameter: boolean) {
      const token = this._internalGetToken(name, isParameter);

      if (!token || token.notationDataName) {
         return;
      }

      const source = new STokenSource(defaultExtractors as any, new EntityMetaData()); // typeHack

      for (let index = 0; index < token.value.length; index++) {
         source.addText(token.value[index].text.str);
      }
      source.endText();

      return source;
   }

   _internalGetToken(name: string, isParameter: boolean) {
      if (name === undefined || name === null) {
         throw new Error('Must call with the name of an entity.');
      }

      const entityEntry = this._entityMap[name];

      if (!entityEntry) {
         return;
      }

      return entityEntry.getBestEntityDeclaration(isParameter);
   }

   _internalGetInfo(name: string, isParameter: boolean) {
      const token = this._internalGetToken(name, isParameter);

      if (!token) {
         return;
      }

      return {
         isParameter: token.isParameter,
         isInternal: !token.externalLoc,
         isParsable: !token.notationDataName,
         // fromInternalSubset?
         getStream() {
            const source = new STokenSource(defaultExtractors as any, new EntityMetaData()); // typeHack

            for (let index = 0; index < token.value.length; index++) {
               source.addText(token.value[index].text.str);
            }
            source.endText();

            return source;
         },
      };
   }
}

/**********************************************************************\
 EntityEntry() is an internal structure which keeps all the entity
 declarations with a particular name. It separates the kind and
 source of each entity declaration, and orders them so that the first
 one of a particular name of a particular kind is returned when asked.
 The kinds, in precedence order, are internal subset, external subset,
 and default.
\**********************************************************************/

class EntityEntry {
   private _general: { [subset: string]: Array<EntityDeclaration> };
   private _parameter: { [subset: string]: Array<EntityDeclaration> };

   constructor() {
      // These will be populated with INTERNAL, EXTERNAL or DEFAULT arrays as they are needed.
      this._general = {};
      this._parameter = {};
   }

   getBestEntityDeclaration(isParameter: boolean) {
      let collection;

      if (isParameter) {
         collection = this._parameter[INTERNAL_SUBSET] ||
            this._parameter[EXTERNAL_SUBSET];
      } else {
         collection = this._general[INTERNAL_SUBSET] ||
            this._general[EXTERNAL_SUBSET] ||
            this._general[DEFAULT_ENTITY];
      }

      return collection ? collection[0] : undefined;
   }

   addEntity(token: EntityDeclaration, isParameter: string, source: string) {
      const map = isParameter ? this._parameter : this._general;

      if (!map[source]) {
         map[source] = [];
      }

      map[source].push(token);
   }
}

export default EntityManager;
