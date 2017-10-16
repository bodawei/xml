/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 Defines simple token that tracks the start of an entity expansion.
\**********************************************************************/

const ENTITY_START = 'ENTITY_START';
const PARAMETERENTITY_START = 'PARAMETERENTITY_START';

class EntityStart extends XmlToken {

   constructor(name) {
      super([]);

      this.name = name;
   }

}

class ParameterEntityStart extends EntityStart {
}

export {
   ENTITY_START as TYPE,
   EntityStart as Token,
   PARAMETERENTITY_START as PARAM_TYPE,
   ParameterEntityStart as ParamToken,
};
