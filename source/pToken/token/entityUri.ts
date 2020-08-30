/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityLocation } from 'basic';

const ENTITY_URI = 'ENTITY_URI';

/*
 * Delivered immediately before the first PToken of an entity.
 * It contains the information needed to identify where the
 * entity came from.
 */
interface EntityUri {
   readonly type: typeof ENTITY_URI;
   readonly location: EntityLocation;
}

export { ENTITY_URI, EntityUri };
