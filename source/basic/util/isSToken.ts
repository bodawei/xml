/* Copyright ® 2021-2022 by 柏大衛. All rights reserved. */

import { SToken } from '../sToken/sToken';

function isSToken(candidate?: unknown): candidate is SToken {
   return typeof candidate === 'object' && !!candidate && 'originalStr' in candidate;
}

export { isSToken };
