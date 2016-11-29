/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const EntityLocation = require('./EntityLocation.js');

const LAST_1DOT0_REVISION = 5;
const LAST_1DOT1_REVISION = 2;

/**********************************************************************\
 EntityMetaData holds values about an entity that will influence how we
 parse it. This includes the type of the entity (document, external,
 external subset), what version of the XML spec it conforms to, and
 the location where it is found.

 The revision of the spec is provided primarily because 1.0 had what
 is really a non-compatible change made between revision 4 and 5,
 so we need to be able to cope with that in parsing.
\**********************************************************************/

class EntityMetaData {

   constructor(entityType, xmlVersion, xmlRevision, location) {
      this._setType(entityType || EntityMetaData.TYPE.DOCUMENT);
      this.version = xmlVersion || 1.0;
      this._setRevision(xmlRevision || (this.versionIs1dot0 ? LAST_1DOT0_REVISION : LAST_1DOT1_REVISION));
      this.location = location || new EntityLocation();
   }

   /**********************************************************************\
    type: When setting the type, make sure it is a legal value.
   \**********************************************************************/

   _setType(newValue) {
      if (EntityMetaData.TYPE[newValue]) {
         this._type = newValue;
      } else {
         throw new Error('Unknown type passed to EntityMetaData.type.  Got "' + newValue + '".');
      }
   }

   get type() {
      return this._type;
   }

   /**********************************************************************\
    Shortcuts for getting the type
   \**********************************************************************/

   get isTypeDocument() {
      return this.type === EntityMetaData.TYPE.DOCUMENT;
   }

   get isTypeExternal() {
      return this.type === EntityMetaData.TYPE.EXTERNAL;
   }

   get isTypeExternalSubset() {
      return this.type === EntityMetaData.TYPE.EXTERNALSUBSET;
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
         this._setRevision(LAST_1DOT0_REVISION);
      } else if (newValue === 1.1) {
         this._version = 1.1;
         this._setRevision(LAST_1DOT1_REVISION);
      } else {
         throw new Error('Unknown version passed to EntityMetaData.version.  Got "' + newValue + '".');
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

   _setRevision(newValue) {
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

EntityMetaData.TYPE = {
   DOCUMENT: 'DOCUMENT',
   EXTERNAL: 'EXTERNAL',
   EXTERNALSUBSET: 'EXTERNALSUBSET'
};

module.exports = EntityMetaData;
