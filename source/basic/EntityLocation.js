/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

// http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
const RELATIVE_REGEX = new RegExp('^([a-z0-9]+:)?//', 'i');
const PROTOCOL_RELATIVE_REGEX = /^\/\//;

function getDirOf(path) {
   if (path[path.length - 1] !== '/') {
      path = path.replace(/\/[^\/]*$/, '/');
   }

   return path;
}

/**********************************************************************\
 EntityLocation corresponds to the ExternalId found on an entity,
 XML or Notation declaration in an XML document. It additionally can
 resolve this location information relative to another (e.g. the
 loading document)
\**********************************************************************/

class EntityLocation {

   /**********************************************************************\
    Constructs an instance with the specified system and public
    identifiers.

    PARAM
    systemId: The systemLiteral
    publicId: The pubidLiteral
   \**********************************************************************/

   constructor(systemId, publicId) {
      this.systemId = systemId || '';
      this.publicId = publicId;
   }

   /**********************************************************************\
    resolve() produces a resolved URL, which is relative to the location
    of another entity. That is, the ExternalId of an entity may be
    specified relative to the location of the base document entity. In
    turn, if one entity happens to contain the declaration to load
    another, then that other can be relative to the first which may be
    relative to the base document.

    PARAM
    sourceLocation: The EntityLocation of the referencing entity.
   \**********************************************************************/

   resolve(sourceLocation) {
      this._parent = sourceLocation;

      if (this._systemIsRelative()) {
         this.resolvedSystemId = getDirOf(sourceLocation.getBestSystemId()) + this.systemId;
      } else if (this._systemIsProtocolRelative()) {
         this.resolvedSystemId = getDirOf(sourceLocation._getSystemProtocol()) + this.systemId;
      } else {
         this.resolvedSystemId = this.systemId;
      }
   }

   getBestSystemId() {
      return this.resolvedSystemId || this.systemId;
   }

   equals(other) {
      if (!other) {
         return false;
      }
      return this.systemId === other.systemId && this.publicId === other.publicId;
   }

   _getSystemProtocol() {
      const matchResults = RELATIVE_REGEX.exec(this.systemId);
      return matchResults[1];
   }

   _systemIsRelative() {
      return !RELATIVE_REGEX.exec(this.systemId);
   }

   _systemIsProtocolRelative() {
      return PROTOCOL_RELATIVE_REGEX.exec(this.systemId);
   }

}

module.exports = EntityLocation;
