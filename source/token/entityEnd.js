/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import base from './base';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const ENTITY_END = 'ENTITY_END';
const ENTITY_END_XTOKEN = 'ENTITY_END_XTOKEN';
const PARAMETERENTITY_END = 'PARAMETERENTITY_END';
const PE_END_XTOKEN = 'PE_END_XTOKEN';

class EntityEnd extends base.XToken {

   constructor(name) {
      super(ENTITY_END_XTOKEN, []);

      this.name = name;
   }

}

class ParameterEntityEnd extends EntityEnd {
   constructor(name) {
      /* istanbul ignore next */
      super(name, []);

      this.type = PE_END_XTOKEN;
   }
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
   XTYPE: ENTITY_END_XTOKEN,
   PARAM_PTYPE: PARAMETERENTITY_END,
   PARAM_XTYPE: PE_END_XTOKEN,
   PToken: EntityEndPToken,
   XToken: EntityEnd,
   ParamPToken: ParameterEntityEndPToken,
   ParamXToken: ParameterEntityEnd,
};

export default entityEnd;
