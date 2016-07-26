/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlStringCursor = require('./XmlStringCursor.js');

/**********************************************************************\
  A cache of available entities.
\**********************************************************************/

class XmlEntityManager {

   /**********************************************************************\
    constructor builds a new instance with the default 5 entities defined.
   \**********************************************************************/

   constructor() {
      this._defaultEntities = {
         lt: '&#60;',
         gt: '>',
         amp: '&#38;',
         apos: '\'',
         quot: '"'
      };
   }

   /**********************************************************************\
    getEntity() returns an XmlCursor with the contents of the requested
    entity, or undefined if there is no such entity present.

    PARAM
    The name of the entity to retreive.

    RETURN
    An XmlCursor
   \**********************************************************************/

   getEntity(name) {
      if (!name) {
         throw new Error('Must call with the name of an entity.');
      }

      if (this._defaultEntities[name]) {
         return new XmlStringCursor(this._defaultEntities[name]);
      }
   }

   /**********************************************************************\
    addEntity() adds the specified entity to the set.

    PARAM
    The name of the entity to add.
    The string of data for the entity.
   \**********************************************************************/

   addEntity(name, data) {
      if (!name) {
         throw new Error('Must call with the name of an entity.');
      }

      if (!data) {
         throw new Error('Must call with data for an entity.');
      }

      this._defaultEntities[name] = data;
   }

}

module.exports = XmlEntityManager;
