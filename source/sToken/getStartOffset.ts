/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Offset } from 'basic';
import SToken from './SToken';

function getStartOffset(sToken: SToken): Offset | undefined {
   if (sToken.ranges.length > 0) {
      const range = sToken.ranges[0];

      return new Offset(range.entityId, range.startIndex, range.startRow, range.startColumn);
   }
}
export { getStartOffset };
