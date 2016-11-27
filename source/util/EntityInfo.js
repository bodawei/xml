/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const EntityLocation = require('../EntityLocation.js');

const LAST_1DOT0_REVISION = 5;
const LAST_1DOT1_REVISION = 2;

/**********************************************************************\
 EntityInfo holds values about an entity that will influence how we
 parse it
\**********************************************************************/

class EntityInfo {

   constructor(entityType, xmlVersion, xmlRevision, location) {
      this.type = entityType || EntityInfo.TYPE.DOCUMENT;
      this.version = xmlVersion || 1.0;
      this.revision = xmlRevision || (this.versionIs1dot0 ? LAST_1DOT0_REVISION : LAST_1DOT1_REVISION);
      this.location = location || new EntityLocation();
      this.overrideDocument = false;
   }

   /**********************************************************************\
    type: When setting the type, make sure it is a legal value.
   \**********************************************************************/

   set type(newValue) {
      if (EntityInfo.TYPE[newValue]) {
         this._type = newValue;
      } else {
         throw new Error('Unknown type passed to EntityInfo.type.  Got "' + newValue + '".');
      }
   }

   get type() {
      return this._type;
   }

   /**********************************************************************\
    Shortcuts for getting the type
   \**********************************************************************/

   get isTypeDocument() {
      return this.type === EntityInfo.TYPE.DOCUMENT;
   }

   get isTypeExternal() {
      return this.type === EntityInfo.TYPE.EXTERNAL;
   }

   get isTypeExternalSubset() {
      return this.type === EntityInfo.TYPE.EXTERNALSUBSET;
   }

   /**********************************************************************\
    version: When setting the version, make sure it is a legal value, and
    reset the revision to the last revision for that version.

    Note that this does not change the revision is the version is not
    changing.
   \**********************************************************************/

   set version(newValue) {
      if (newValue === this._version) {
         return;
      }

      if (newValue === 1.0) {
         this._version = 1.0;
         this.revision = LAST_1DOT0_REVISION;
      } else if (newValue === 1.1) {
         this._version = 1.1;
         this.revision = LAST_1DOT1_REVISION;
      } else {
         throw new Error('Unknown version passed to EntityInfo.version.  Got "' + newValue + '".');
      }
   }

   get version() {
      return this._version;
   }

   /**********************************************************************\
    Shortcuts for checking the version
   \**********************************************************************/

   get versionIs1dot0() {
      return this.version === 1.0;
   }

   get versionIs1dot1() {
      return this.version === 1.1;
   }

   /**********************************************************************\
    revision: Sets the revision. Valid revisions depend on the value of
    version. So, if you need to change both, change version first.
   \**********************************************************************/

   set revision(newValue) {
      if ((this.version === 1.0 && newValue > 0 && newValue <= LAST_1DOT0_REVISION) ||
         (this.version === 1.1 && newValue > 0 && newValue <= LAST_1DOT1_REVISION)) {
         this._revision = newValue;
      } else {
         throw new Error('Version and revision do not match. Got "' +
            this.version + '" and "' + newValue + '".');
      }
   }

   get revision() {
      return this._revision;
   }

}

EntityInfo.TYPE = {
   DOCUMENT: 'DOCUMENT',
   EXTERNAL: 'EXTERNAL',
   EXTERNALSUBSET: 'EXTERNALSUBSET'
};

module.exports = EntityInfo;
