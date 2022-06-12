/* Copyright ® 2016-2022 by 柏大衛. All rights reserved. */

import { SToken } from '../sToken/sToken';
import { EntityId } from '../token/entityId';
import { Range } from '../util/range';

function toSToken(str: string): SToken {
   return new SToken(str, str, new Range(new EntityId()));
}

export { toSToken };
