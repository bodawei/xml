/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { Offset } from './offset';
import { Range } from './range';

function rangeStartOffset(range: Range): Offset {
   return new Offset(range.entityId, range.startIndex, range.startRow, range.startColumn);
}

export { rangeStartOffset };
