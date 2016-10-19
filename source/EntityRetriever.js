/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const Promise = require('es6-promise');
const XmlStringCursor = require('./XmlStringCursor.js');

/**********************************************************************\
 EntityRetriever
\**********************************************************************/

class EntityRetriever {

   /**********************************************************************\
    PARAM
    entityLocation: an entity location object. It must have been resolved.
    options: an object with properties.
   \**********************************************************************/

   getEntity(entityLocation) {

      return new Promise((resolve) => {
         resolve(new XmlStringCursor('testing', entityLocation));
      });
   }

}

module.exports = EntityRetriever;
