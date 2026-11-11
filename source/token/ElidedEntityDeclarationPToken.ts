/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken, PARAMETER_ENTITY_DECLARATION_PTOKEN } from 'pToken';
import { SToken } from 'basic';

import { EntityValuePToken } from './EntityValuePToken';

const ELIDED_ENTITY_DECLARATION_PTOKEN = 'ELIDED_ENTITY_DECLARATION_PTOKEN';

class ElidedEntityDeclarationPToken {
   public readonly type: typeof ELIDED_ENTITY_DECLARATION_PTOKEN;
   public readonly name?: SToken;
   public readonly isPE: boolean;
   public readonly token: ParameterEntityDeclarationPToken;
   public readonly value: EntityValuePToken;

   constructor(token: ParameterEntityDeclarationPToken, value: EntityValuePToken) {
      this.value = value;
      this.name = token.name;
      this.token = token;
      this.isPE = token.type === PARAMETER_ENTITY_DECLARATION_PTOKEN;
      this.type = ELIDED_ENTITY_DECLARATION_PTOKEN;
   }
}

export { ELIDED_ENTITY_DECLARATION_PTOKEN, ElidedEntityDeclarationPToken };
