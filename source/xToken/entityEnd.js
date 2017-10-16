/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const ENTITY_END = 'ENTITY_END';
const PARAMETERENTITY_END = 'PARAMETERENTITY_END';

class EntityEnd extends XmlToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

class ParameterEntityEnd extends XmlToken {
}

export {
   ENTITY_END as TYPE,
   EntityEnd as Token,
   PARAMETERENTITY_END as PARAM_TYPE,
   ParameterEntityEnd as ParamToken,
};
