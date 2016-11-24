/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/**********************************************************************\
 EntityInfo holds values about an entity that will influence how we
 parse it
\**********************************************************************/

class EntityInfo {

   constructor(entityType, xmlVersion, xmlRevision) {
      this.entityType = entityType || EntityInfo.ENTITY_TYPE.DOCUMENT_ENTITY;
      this.version = xmlVersion || EntityInfo.VERSION['1.0'];
      this.revision = xmlRevision || EntityInfo.REVISION.R5;
   }

   setVersion(newVersion) {
      let newRevision;

      newVersion = newVersion || EntityInfo.VERSION['1.0'];

      if (newVersion !== this.version) {
         if (newVersion === EntityInfo.VERSION['1.1']) {
            newRevision = EntityInfo.REVISION.R2;
         } else if (newVersion === EntityInfo.VERSION['1.0']) {
            newRevision = EntityInfo.REVISION.R5;
         } else {
            throw new Error('Unknown version passed to EntityInfo.setVersion().  Got "' + newVersion + '".');
         }

         this.version = newVersion;
         this.revision = newRevision;
      }
   }

   versionIs1dot0() {
      return this.version === '1.0';
   }

   versionIs1dot1() {
      return this.version === '1.1';
   }

}

EntityInfo.ENTITY_TYPE = {
   DOCUMENT_ENTITY: 'DOCUMENT_ENTITY',
   EXTERNAL_ENTITY: 'EXTERNAL_ENTITY',
   EXTERNAL_SUBSET: 'EXTERNAL_SUBSET'
};

EntityInfo.VERSION = {
   '1.0': '1.0',
   1.1: '1.1'
};

EntityInfo.REVISION = {
   R1: 'R1',
   R2: 'R2',
   R3: 'R3',
   R4: 'R4',
   R5: 'R5'
};

module.exports = EntityInfo;
