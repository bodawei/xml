/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const ENTITY_START = 'ENTITY_START';

class EntityStart extends XmlToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

export {
   ENTITY_START as TYPE,
   EntityStart as Token,
};
