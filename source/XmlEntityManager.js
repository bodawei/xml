/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const EntityMetaData = require('./shared/EntityMetaData.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const tokens = require('./XmlToken.js');

const DEFAULT_ENTITY = 'DefaultEntity';
const INTERNAL_SUBSET = 'EntityDeclaredInInternalSubset';
const EXTERNAL_SUBSET = 'EntityDeclaredInExternalSubset';
const EXTERNAL_SUBSET_NAME = '\tEXTERNAL\tSUBSET\t';

const DEF_CHUNKS = [ new TextChunk.PlainChunk('default') ];

/**********************************************************************\
  A cache of available entities.
\**********************************************************************/

class XmlEntityManager {

   /**********************************************************************\
    constructor builds a new instance with the default 5 entities defined.
   \**********************************************************************/

   constructor() {
      this._entityMap = {};
      this._paramEntityMap = {};

      this.addEntity(new tokens.EntityDeclaration('lt', [ new tokens.Text('&#60;', tokens.ENTITYVAL_NO_CHUNKS) ],
         undefined, undefined, DEF_CHUNKS), DEFAULT_ENTITY);
      this.addEntity(new tokens.EntityDeclaration('gt', [ new tokens.Text('>', tokens.ENTITYVAL_NO_CHUNKS) ],
         undefined, undefined, DEF_CHUNKS), DEFAULT_ENTITY);
      this.addEntity(new tokens.EntityDeclaration('amp', [ new tokens.Text('&#38;', tokens.ENTITYVAL_NO_CHUNKS) ],
         undefined, undefined, DEF_CHUNKS), DEFAULT_ENTITY);
      this.addEntity(new tokens.EntityDeclaration('apos', [ new tokens.Text('\'', tokens.ENTITYVAL_NO_CHUNKS) ],
         undefined, undefined, DEF_CHUNKS), DEFAULT_ENTITY);
      this.addEntity(new tokens.EntityDeclaration('quot', [ new tokens.Text('"', tokens.ENTITYVAL_NO_CHUNKS) ],
         undefined, undefined, DEF_CHUNKS), DEFAULT_ENTITY);
   }

   /**********************************************************************\
    addEntity() adds the specified general entity to the set. If an
    entity with that name already exists, it is added to the manager for
    record-keeping purposes, but get will not retrieve it.

    PARAM
    token: The EntityToken to add
    type: Either XmlEntityManager.INTERNAL_SUBSET or EXTERNAL_SUBSET
   \**********************************************************************/

   addEntity(token, type = INTERNAL_SUBSET) {
      this._internalAdd(token, type, false);
   }

   /**********************************************************************\
    addParameterEntity() adds the specified parameter entity to the set.

    PARAM
    token: The EntityToken to add
    type: Either XmlEntityManager.INTERNAL_SUBSET or EXTERNAL_SUBSET
   \**********************************************************************/

   addParameterEntity(token, type = INTERNAL_SUBSET) {
      this._internalAdd(token, type, true);
   }

   /**********************************************************************\
    addExternalSubsetEntity() Adds the specified location as the location
    of the external subset entity, which can be retrieved only with
    getExternalSubsetEntity

    PARAM
    location: An EntityLocation. If undefined, this does nothing.
   \**********************************************************************/

   addExternalSubsetEntity(location) {
      if (!location) {
         return;
      }
      const token = new tokens.EntityDeclaration(EXTERNAL_SUBSET_NAME,
         [ new tokens.Text('', tokens.ENTITYVAL_NO_CHUNKS) ], location, undefined,
         tokens.ENTITYVAL_NO_CHUNKS);
      this._internalAdd(token, EXTERNAL_SUBSET, true);
   }

   /**********************************************************************\
    getEntity() returns an XmlCursor with the contents of the requested
    general entity, or undefined if there is no such entity present.
    Note that entities declared earlier take precedence over those
    declared later, and internal take precedence over external

    PARAM
    The name of the entity to retreive.

    RETURN
    An XmlCursor or undefined
   \**********************************************************************/

   getEntity(name) {
      return this._internalGet(name, false);
   }

   /**********************************************************************\
    getParameterEntity() returns an XmlCursor with the contents of the
    requested parameter entity, or undefined if there is no such entity
    present.  Note that entities declared earlier take precedence over
    those declared later, and internal take precedence over external

    PARAM
    The name of the entity to retreive.

    RETURN
    An XmlCursor or undefined
   \**********************************************************************/

   getParameterEntity(name) {
      return this._internalGet(name, true);
   }

   /**********************************************************************\
    getExternalSubsetEntity() Retrieves a cursor for the external subset
    entity, or returns undefiend if none has been specified.

    RETURN
    An XmlCursor or undefined
   \**********************************************************************/

   getExternalSubsetEntity() {
      return this._internalGet(EXTERNAL_SUBSET_NAME, true, true);
   }

   /**********************************************************************\
    isEntityUnparsed() returns true if the specified entity is unparsed,
    that is had an NDataDecl.

    PARAM
    The name of the entity to examine.

    RETURN
    true or false
   \**********************************************************************/

   isEntityUnparsed(name) {
      return this._internalIsEntityUnparsed(name, false);
   }

   /**********************************************************************\
    isParameterEntityUnparsed() returns true if the specified parameter
    entity is unparsed, that is had an NDataDecl.

    PARAM
    The name of the entity to examine.

    RETURN
    true or false
   \**********************************************************************/

   isParameterEntityUnparsed(name) {
      return this._internalIsEntityUnparsed(name, true);
   }

   /**********************************************************************\
    isEntityUnparsed() returns true if the specified entity is unparsed,
    that is had an NDataDecl.

    PARAM
    The name of the entity to examine.

    RETURN
    true or false
   \**********************************************************************/

   getEntityToken(name) {
      return this._internalGetEntityToken(name, false);
   }

   /**********************************************************************\
    isParameterEntityUnparsed() returns true if the specified parameter
    entity is unparsed, that is had an NDataDecl.

    PARAM
    The name of the entity to examine.

    RETURN
    true or false
   \**********************************************************************/

   getParameterEntityToken(name) {
      return this._internalGetEntityToken(name, true);
   }

   /**********************************************************************\
    _internalGet() retrieves the specified entity (or returns undefined).
    It tives precedence to the internal entity declarations over the
    external over the default ones.
   \**********************************************************************/

   _internalGet(name, isParameter, isExternalSubset) {
      const info = this._internalGetEntityData(name, isParameter);

      if (!info) {
         return;
      }

      if (info.token.notationDataName) {
         return;
      }

      return new XmlStringCursor(info.token.value[0].text,
         new EntityMetaData(isExternalSubset ? EntityMetaData.TYPE.EXTERNALSUBSET : EntityMetaData.TYPE.EXTERNAL));
   }

   _internalGetEntityToken(name, isParameter) {
      const info = this._internalGetEntityData(name, isParameter);

      if (!info) {
         return;
      }

      return info.token;
   }

   _internalGetEntityData(name, isParameter) {
      if (!name) {
         throw new Error('Must call with the name of an entity.');
      }

      const entityEntry = this._lookupEntityEntry(name, isParameter, false);

      if (!entityEntry) {
         return;
      }

      return entityEntry.getBestEntityData();
   }

   /**********************************************************************\
    _internalAdd() adds the specified general or parameter entity
    information
   \**********************************************************************/

   _internalAdd(token, type, isParameter) {
      if (!token || !(token instanceof tokens.EntityDeclaration)) {
         throw new Error('Must call with an entity declaration token.');
      }

      const entityEntry = this._lookupEntityEntry(token.name, isParameter, true);
      const subInfo = entityEntry[type];

      subInfo.push(new EntityData(token));
   }

   /**********************************************************************\
    _internalIsEntityUnparsed() returns true if the entity with that name
    is an unparsed entity (had an NDECL), false otherwise
   \**********************************************************************/

   _internalIsEntityUnparsed(name, isParameter) {
      if (!name) {
         throw new Error('Must call with the name of an entity.');
      }

      const entityEntry = this._lookupEntityEntry(name, isParameter, false);

      if (!entityEntry) {
         return false;
      }

      const info = entityEntry.getBestEntityData();

      return !!info.token.notationDataName;
   }

   /**********************************************************************\
    _lookupEntityEntry() looks up the specified entity, potentially
    creating an entry of it if needed.
   \**********************************************************************/

   _lookupEntityEntry(name, isParameter, create) {
      const map = isParameter ? this._paramEntityMap : this._entityMap;

      if (!map[name] && create) {
         map[name] = new EntityEntry();
      }

      return map[name];
   }

}

class EntityEntry {

   constructor() {
      this[DEFAULT_ENTITY] = [];
      this[INTERNAL_SUBSET] = [];
      this[EXTERNAL_SUBSET] = [];
   }

   getBestEntityData() {
      if (this[INTERNAL_SUBSET].length > 0) {
         return this[INTERNAL_SUBSET][0];
      } else if (this[EXTERNAL_SUBSET].length > 0) {
         return this[EXTERNAL_SUBSET][0];
      } else {
         // if we get this far, we have to have a default entry.
         return this[DEFAULT_ENTITY][0];
      }
   }
}

class EntityData {

   constructor(token) {
      this.token = token;
   }

}

XmlEntityManager.DEFAULT_ENTITY = DEFAULT_ENTITY;
XmlEntityManager.INTERNAL_SUBSET = INTERNAL_SUBSET;
XmlEntityManager.EXTERNAL_SUBSET = EXTERNAL_SUBSET;

module.exports = XmlEntityManager;
