/* Copyright ® 2020 by 柏大衛. All rights reserved. */

const ENTITY_ID = 'ENTITY_ID';

/*
 * Carries the textual representation of the identifier of an
 * entity. This can be thought of as a condensed version of
 * an ExternalId. However, its role in the system is either
 * as a piece of metadata describing the location of the
 * document entity, or a transient bit of data used to
 * identify an entity during the expansion process.
 */
class EntityId {
   readonly type: typeof ENTITY_ID = ENTITY_ID;

   readonly systemId: string;

   readonly publicId?: string;

   constructor(systemId?: string, publicId?: string) {
      this.systemId = systemId || '';
      this.publicId = publicId;
   }
}

export { ENTITY_ID, EntityId };
