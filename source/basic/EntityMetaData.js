/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import EntityLocation from './EntityLocation.js';

const LAST_1DOT0_REVISION = 6;
const DEFAULT_1DOT0_REVISION = 5;
const LAST_1DOT1_REVISION = 2;

/**********************************************************************\
 EntityMetaData holds values about an entity that will influence how we
 parse it. This includes the kind of the entity (document, external,
 external subset), what version of the XML spec it conforms to, and
 the location where it is found.

 The revision of the spec is provided primarily because 1.0 had what
 is really a non-compatible change made between revision 4 and 5,
 so we need to be able to cope with that in parsing.
\**********************************************************************/

class EntityMetaData {

   constructor(entityKind, xmlVersion, xmlRevision, location) {
      this.type = EntityMetaData.PTYPE;
      this._setKind(entityKind || EntityMetaData.KIND.DOCUMENT);
      this.version = xmlVersion || 1.0;
      this._setRevision(xmlRevision || (this.isVersion1dot0 ? DEFAULT_1DOT0_REVISION : LAST_1DOT1_REVISION));
      this.location = location || new EntityLocation();
   }

   /**********************************************************************\
    type: When setting the type, make sure it is a legal value.
   \**********************************************************************/

   _setKind(newValue) {
      if (EntityMetaData.KIND[newValue]) {
         this._type = newValue;
      } else {
         throw new Error('Unknown type passed to EntityMetaData.type.  Got "' + newValue + '".');
      }
   }

   get kind() {
      return this._type;
   }

   /**********************************************************************\
    Shortcuts for getting the type
   \**********************************************************************/

   get isDocumentKind() {
      return this.kind === EntityMetaData.KIND.DOCUMENT;
   }

   get isExternalKind() {
      return this.kind === EntityMetaData.KIND.EXTERNAL;
   }

   get isExternalSubsetKind() {
      return this.kind === EntityMetaData.KIND.EXTERNALSUBSET;
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
         this._setRevision(DEFAULT_1DOT0_REVISION);
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

   get isVersion1dot0() {
      return this.version === 1.0;
   }

   get isVersion1dot1() {
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

EntityMetaData.KIND = {
   DOCUMENT: 'DOCUMENT',
   EXTERNAL: 'EXTERNAL',
   EXTERNALSUBSET: 'EXTERNALSUBSET',
};

EntityMetaData.PTYPE = 'ENTITY_META_DATA';

module.exports = EntityMetaData;
