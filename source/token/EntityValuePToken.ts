import { CharRefPToken, ParameterEntityReferencePToken, TextPToken } from 'pToken';

import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from './marker/parameterEntityStart';

type EntityValueElement =
   | TextPToken
   | CharRefPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken;
type EntityValuePToken = Array<EntityValueElement>;

export { EntityValueElement, EntityValuePToken };
