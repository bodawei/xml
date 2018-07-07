/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import EntityLocation from './EntityLocation.js';

const LAST_1DOT0_REVISION = 6;
const DEFAULT_1DOT0_REVISION = 5;
const LAST_1DOT1_REVISION = 3;
const DEFAULT_1DOT1_REVISION = 2;

/**********************************************************************\
 EntityMetaData holds values about an entity that will influence how we
 parse it. This includes the kind of the entity (document, external,
 external subset), what version of the XML spec it conforms to, and
 the location where it is found.

 The revision of the spec is provided primarily because 1.0 had what
 is really a non-compatible change made between revision 4 and 5,
 so we need to be able to cope with that in parsing.
\**********************************************************************/

type XmlVersion = 1.0 | 1.1;
type XmlRevision = 1 | 2 | 3 | 4 | 5 | 6;

enum EntityKind {
   DOCUMENT = 'DOCUMENT',
   EXTERNAL = 'EXTERNAL',
   EXTERNALSUBSET = 'EXTERNALSUBSET',
}

class EntityMetaData {
   public static readonly TYPE = 'ENTITY_META_DATA';
   public location: EntityLocation;
   public readonly type = EntityMetaData.TYPE;
   private _kind: EntityKind;
   private _version: XmlVersion = 1.0;
   private _revision: XmlRevision = 5;

   constructor(entityKind: EntityKind = EntityKind.DOCUMENT, xmlVersion: XmlVersion = 1.0, xmlRevision?: XmlRevision, location: EntityLocation = new EntityLocation()) {
      this._kind = entityKind;
      this.version = xmlVersion;
      this._setRevision(xmlRevision || (this.isVersion1dot0 ? DEFAULT_1DOT0_REVISION : DEFAULT_1DOT1_REVISION));
      this.location = location;
   }

   /**********************************************************************\
    type: When setting the type, make sure it is a legal value.
   \**********************************************************************/

   get kind(): string {
      return this._kind;
   }

   /**********************************************************************\
    Shortcuts for getting the type
   \**********************************************************************/

   get isDocumentKind(): boolean {
      return this.kind === EntityKind.DOCUMENT;
   }

   get isExternalKind(): boolean {
      return this.kind === EntityKind.EXTERNAL;
   }

   get isExternalSubsetKind(): boolean {
      return this.kind === EntityKind.EXTERNALSUBSET;
   }

   /**********************************************************************\
    version: When setting the version, make sure it is a legal value, and
    reset the revision to the last revision for that version.

    Note that this does not change the revision is the version is not
    changing.
   \**********************************************************************/

   set version(newValue: XmlVersion) {
      if (newValue === this._version) {
         return;
      }

      if (newValue === 1.0) {
         this._version = 1.0;
         this._setRevision(DEFAULT_1DOT0_REVISION);
      } else if (newValue === 1.1) {
         this._version = 1.1;
         this._setRevision(DEFAULT_1DOT1_REVISION);
      }
   }

   get version(): XmlVersion {
      return this._version;
   }

   /**********************************************************************\
    Shortcuts for checking the version
   \**********************************************************************/

   get isVersion1dot0(): boolean {
      return this.version === 1.0;
   }

   get isVersion1dot1(): boolean {
      return this.version === 1.1;
   }

   /**********************************************************************\
    revision: Sets the revision. Valid revisions depend on the value of
    version. So, if you need to change both, change version first.
   \**********************************************************************/

   _setRevision(newValue: XmlRevision) {
      if ((this.version === 1.0 && newValue > 0 && newValue <= LAST_1DOT0_REVISION) ||
         (this.version === 1.1 && newValue > 0 && newValue <= LAST_1DOT1_REVISION)) {
         this._revision = newValue;
      } else {
         throw new Error('Version and revision do not match. Got "' +
            this.version + '" and "' + newValue + '".');
      }
   }

   get revision(): XmlRevision {
      return this._revision;
   }

}

export default EntityMetaData;
export { EntityKind };