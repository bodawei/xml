/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import * as base from './base.js';

/**********************************************************************\
 Defines simple token that tracks the start of an entity expansion.
\**********************************************************************/

const ENTITY_START = 'ENTITY_START';
const PARAMETERENTITY_START = 'PARAMETERENTITY_START';

class EntityStart extends base.XToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

class ParameterEntityStart extends EntityStart {
}

export {
   ENTITY_START as PTYPE,
   EntityStart as XToken,
   PARAMETERENTITY_START as PARAM_PTYPE,
   ParameterEntityStart as ParamXToken,
};
