/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { Offset } from './offset';
import { Range } from './range';

function rangeEndOffset(range: Range): Offset {
   return new Offset(range.entityId, range.endIndex, range.endRow, range.endColumn);
}

export { rangeEndOffset };
