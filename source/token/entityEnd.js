/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

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

class EntityEndPToken extends base.PToken {
   constructor(props) {
      super(ENTITY_END, props);
      this.refPToken = props.refPToken;
   }
}

class ParameterEntityEndPToken extends EntityEndPToken {
   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(props);
      this.type = PARAMETERENTITY_END;
   }
}

const entityEnd = {
   PTYPE: ENTITY_END,
   PARAM_PTYPE: PARAMETERENTITY_END,
   PToken: EntityEndPToken,
   XToken: EntityEnd,
   ParamPToken: ParameterEntityEndPToken,
   ParamXToken: ParameterEntityEnd,
};

export default entityEnd;
