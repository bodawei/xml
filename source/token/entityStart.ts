/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import base from './base';

import { EntityReferencePToken } from './entityReference';

/**********************************************************************\
 Defines simple token that tracks the start of an entity expansion.
\**********************************************************************/

const ENTITY_START = 'ENTITY_START';
const ENTITY_START_XTOKEN = 'ENTITY_START_XTOKEN';
const PARAMETERENTITY_START = 'PARAMETERENTITY_START';
const PENTITY_XTOKEN = 'PENTITY_XTOKEN';

class EntityStart extends base.XToken {
   public name: string;

   constructor(name: string) {
      super(ENTITY_START_XTOKEN);

      this.name = name;
   }

}

class ParameterEntityStart extends EntityStart {
   public type: string;

   constructor(name: string) {
      /* istanbul ignore next */
      super(name);
      this.type = PENTITY_XTOKEN;
   }

}

class EntityStartPToken extends base.PToken {
   public refPToken: EntityReferencePToken;

   constructor(props?: Object) {
      super(ENTITY_START, props);
      this.refPToken = (props as any).refPToken;
   }
}

class ParameterEntityStartPToken extends EntityStartPToken {
   constructor(props?: Object) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(props);
      this.type = PARAMETERENTITY_START;
   }
}

const entityStart = {
   PTYPE: ENTITY_START,
   XTYPE: ENTITY_START_XTOKEN,
   PE_XTYPE: PENTITY_XTOKEN,
   PToken: EntityStartPToken,
   XToken: EntityStart,
   PARAM_PTYPE: PARAMETERENTITY_START,
   ParamPToken: ParameterEntityStartPToken,
   ParamXToken: ParameterEntityStart,
};

export default entityStart;

export {
   ParameterEntityStart as ParameterEntityStartXToken,
   ParameterEntityStartPToken,
   EntityStart,
   EntityStartPToken,
};
