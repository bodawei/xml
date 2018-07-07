/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

// http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
const RELATIVE_REGEX = new RegExp('^([a-z0-9]+:)?//', 'i');
const PROTOCOL_RELATIVE_REGEX = /^\/\//;

function getDirOf(path: string): string {
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
   public systemId: string;
   public publicId?: string;
   private base?: EntityLocation;

   /*
    * Returns a resolved URL, which is relative to the location
    * of the base EntityLocation (if set). That is, the ExternalId
    * of an entity may be specified relative to the location of the
    * base document entity. In turn, if one entity happens to contain
    * the declaration to load another, then that other can be
    * relative to the first which may be relative to the base document.
    */
   get resolvedSystemId() {
      let resolved = this.systemId;

      if (this.base && this.systemIsRelative()) {
         resolved = getDirOf(this.base.resolvedSystemId) + this.systemId;
      } else if (this.base && this.systemIsProtocolRelative()) {
         resolved = getDirOf(this.base.getSystemProtocol()) + this.systemId;
      }

      return resolved || this.systemId;
   }

   /**********************************************************************\
    Constructs an instance with the specified system and public
    identifiers.

    PARAM
    systemId: The systemLiteral
    publicId: The pubidLiteral
   \**********************************************************************/

   constructor(systemId: string = '', publicId?: string) {
      this.systemId = systemId;
      this.publicId = publicId;
   }

   /**********************************************************************\
    setBaseLocation() takes another entity location and uses this to
    compute the resolved System ID.  
   \**********************************************************************/

   setBaseLocation(sourceLocation: EntityLocation) {
      this.base = new EntityLocation(sourceLocation.resolvedSystemId, sourceLocation.publicId);
   }

   equals(other?: any): boolean {
      if (!other || !(other instanceof EntityLocation)) {
         return false;
      }
      return this.systemId === other.systemId && this.publicId === other.publicId;
   }

   private getSystemProtocol() {
      const matchResults = RELATIVE_REGEX.exec(this.systemId)!;
      return matchResults[1];
   }

   private systemIsRelative() {
      return !RELATIVE_REGEX.exec(this.systemId);
   }

   private systemIsProtocolRelative() {
      return PROTOCOL_RELATIVE_REGEX.exec(this.systemId);
   }

}

export default EntityLocation;
