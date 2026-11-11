/* Copyright ® 2021-2022 by 柏大衛. All rights reserved. */

import { SToken } from '../sToken/sToken';
import { Offset } from './offset';

function getSTokenStartOffset(sToken: SToken): Offset | undefined {
   const range = sToken.ranges[0];

   if (range) {
      return new Offset(range.entityId, range.startIndex, range.startRow, range.startColumn);
   }
}

export { getSTokenStartOffset };
