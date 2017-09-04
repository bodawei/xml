/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import {
   entityDeclaration,
   text,
} from '../xToken';

const DEFAULT_ENTITY = 'DefaultEntity';
const INTERNAL_SUBSET = 'EntityDeclaredInInternalSubset';
const EXTERNAL_SUBSET = 'EntityDeclaredInExternalSubset';

/**********************************************************************\
  A cache of available entities.
  It includes the five default entities pre-added.
\**********************************************************************/

class EntityManager {

   constructor() {
      this._entityMap = {};

      const ltEntity = new entityDeclaration.Token('lt', [ new text.Token('&#60;', []) ], undefined, undefined, []);
      const gtEntity = new entityDeclaration.Token('gt', [ new text.Token('>', []) ], undefined, undefined, []);
      const ampEntity = new entityDeclaration.Token('amp', [ new text.Token('&#38;', []) ], undefined, undefined, []);
      const aposEntity = new entityDeclaration.Token('apos', [ new text.Token('\'', []) ], undefined, undefined, []);
      const quotEntity = new entityDeclaration.Token('quot', [ new text.Token('"', []) ], undefined, undefined, []);

      this._internalAdd(ltEntity, DEFAULT_ENTITY, false);
      this._internalAdd(gtEntity, DEFAULT_ENTITY, false);
      this._internalAdd(ampEntity, DEFAULT_ENTITY, false);
      this._internalAdd(aposEntity, DEFAULT_ENTITY, false);
      this._internalAdd(quotEntity, DEFAULT_ENTITY, false);
   }

   addEntityFromInternalSubset(entityDeclarationToken) {
      this._internalAdd(entityDeclarationToken, INTERNAL_SUBSET, false);
   }

   addEntityFromExternalSubset(entityDeclarationToken) {
      this._internalAdd(entityDeclarationToken, EXTERNAL_SUBSET, false);
   }

   addParameterEntityFromInternalSubset(entityDeclarationToken) {
      this._internalAdd(entityDeclarationToken, INTERNAL_SUBSET, true);
   }

   addParameterEntityFromExternalSubset(entityDeclarationToken) {
      this._internalAdd(entityDeclarationToken, EXTERNAL_SUBSET, true);
   }

   /**********************************************************************\
    getEntity() returns an LTokenSource with the contents of the requested
    general entity, or undefined if there is no such entity present.
   \**********************************************************************/

   getEntity(name) {
      return this._internalGet(name, false);
   }

   getParameterEntity(name) {
      return this._internalGet(name, true);
   }

   /**********************************************************************\
    setExternalSubsetEntity() Adds the specified EntityLocation as the
    location of the external subset entity.
   \**********************************************************************/

   setExternalSubsetEntity(entityLocation) {
      this._externalEntityLocation = entityLocation;
   }

   /**********************************************************************\
    getExternalSubsetEntity() Retrieves a LTokenSource for the external
    subset entity, or returns undefiend if none has been specified.
   \**********************************************************************/

   getExternalSubsetEntity() {
      if (!this._externalEntityLocation) {
         return;
      }

      const source = new LTokenSource(defaultExtractors,
         new EntityMetaData(EntityMetaData.EXTERNAL_SUBSET, undefined, undefined, this._externalEntityLocation));
      return source;
   }

   /**********************************************************************\
    _internalAdd() adds the specified general or parameter entity
    information
   \**********************************************************************/

   _internalAdd(token, source, isParameter) {
      if (!token || !(token instanceof entityDeclaration.Token)) {
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

   _internalGet(name, isParameter) {
      if (!name) {
         throw new Error('Must call with the name of an entity.');
      }

      const entityEntry = this._entityMap[name];

      if (!entityEntry) {
         return;
      }

      const token = entityEntry.getBestEntityDeclaration(isParameter);

      if (!token || token.notationDataName) {
         return;
      }

      const source = new LTokenSource(defaultExtractors, new EntityMetaData());
      for (let index = 0; index < token.value.length; index++) {
         source.addText(token.value[index].text);
      }
      source.endText();

      return source;
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

   constructor() {
      // These will be populated with INTERNAL, EXTERNAL or DEFAULT arrays as they are needed.
      this._general = {};
      this._parameter = {};
   }

   getBestEntityDeclaration(isParameter) {
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

   addEntity(token, isParameter, source) {
      const map = isParameter ? this._parameter : this._general;

      if (!map[source]) {
         map[source] = [];
      }

      map[source].push(token);
   }
}

export default EntityManager;
