/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const ENTITY_END = 'ENTITY_END';

class EntityEnd extends XmlToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

export {
   ENTITY_END as TYPE,
   EntityEnd as Token,
};
