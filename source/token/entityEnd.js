/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import * as base from './base.js';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const ENTITY_END = 'ENTITY_END';
const PARAMETERENTITY_END = 'PARAMETERENTITY_END';

class EntityEnd extends base.XToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

class ParameterEntityEnd extends EntityEnd {
}

export {
   ENTITY_END as PTYPE,
   EntityEnd as XToken,
   PARAMETERENTITY_END as PARAM_PTYPE,
   ParameterEntityEnd as ParamXToken,
};
