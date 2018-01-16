/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

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

class EntityStartPToken extends base.PToken {
   constructor(props) {
      super(ENTITY_START, props);
      this.refPToken = props.refPToken;
   }
}

class ParameterEntityStartPToken extends EntityStartPToken {
   constructor(props) {
      super(props);
      this.type = PARAMETERENTITY_START;
   }
}

const entityStart = {
   PTYPE: ENTITY_START,
   PToken: EntityStartPToken,
   XToken: EntityStart,
   PARAM_PTYPE: PARAMETERENTITY_START,
   ParamPToken: ParameterEntityStartPToken,
   ParamXToken: ParameterEntityStart,
};

export default entityStart;
