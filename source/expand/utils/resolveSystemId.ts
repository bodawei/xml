/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityId } from 'pToken';

// http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
const RELATIVE_REGEX = new RegExp('^([a-z0-9]+:)?//', 'i');
const PROTOCOL_RELATIVE_REGEX = /^\/\//;

function getDirOf(path: string): string {
   if (path[path.length - 1] !== '/') {
      return path.replace(/\/[^/]*$/, '/');
   }

   return path;
}

function getSystemProtocol(systemId: string): string {
   const matchResults = RELATIVE_REGEX.exec(systemId);
   return !matchResults ? '' : matchResults[1];
}

function systemIsRelative(systemId: string): boolean {
   return !RELATIVE_REGEX.exec(systemId);
}

function systemIsProtocolRelative(systemId: string): boolean {
   return PROTOCOL_RELATIVE_REGEX.test(systemId);
}

/*
 * Returns a resolved URL, which is relative to the location
 * of the base EntityLocation (if set).
 *
 * §4.2.2 [Definition: The SystemLiteral is called the entity's system identifier.
 * It is meant to be converted to a URI reference (as defined in [IETF RFC 3986]),
 * as part of the process of dereferencing it to obtain input for the XML processor
 * to construct the entity's replacement text.] It is an error for a fragment
 * identifier (beginning with a # character) to be part of a system identifier.
 * Unless otherwise provided by information outside the scope of this specification
 * (e.g. a special XML element type defined by a particular DTD, or a processing
 * instruction defined by a particular application specification), relative URIs
 * are relative to the location of the resource within which the entity declaration
 * occurs. This is defined to be the external entity containing the '<' which
 * starts the declaration, at the point when it is parsed as a declaration.
 * A URI might thus be relative to the document entity, to the entity containing
 * the external DTD subset, or to some other external parameter entity.
 * Attempts to retrieve the resource identified by a URI may be redirected at
 * the parser level (for example, in an entity resolver) or below (at the protocol
 * level, for example, via an HTTP Location: header). In the absence of additional
 * information outside the scope of this specification within the resource,
 * the base URI of a resource is always the URI of the actual resource returned.
 * In other words, it is the URI of the resource retrieved after all redirection
 * has occurred.
 */
function resolveSystemId(baseId: EntityId | undefined, newEntity?: EntityId): string {
   if (!baseId) {
      return newEntity?.systemId || '';
   }

   if (!newEntity) {
      return baseId.systemId;
   }

   let resolved = newEntity?.systemId || './index.xml---JUNK';

   if (baseId && systemIsRelative(newEntity?.systemId)) {
      resolved = getDirOf(baseId.systemId) + newEntity?.systemId;
   } else if (baseId && systemIsProtocolRelative(newEntity?.systemId)) {
      resolved = getDirOf(getSystemProtocol(baseId.systemId)) + newEntity?.systemId;
   }

   return resolved;
}

export { resolveSystemId };
