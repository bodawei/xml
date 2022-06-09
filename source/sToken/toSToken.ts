/* Copyright ® 2016-2022 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';
import SToken from './SToken';

function toSToken(str: string): SToken {
   return new SToken(str, str, new Range(new EntityId()));
}

export { toSToken };
