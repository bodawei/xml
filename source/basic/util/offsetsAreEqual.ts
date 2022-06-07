/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { Offset } from '../util/offset';

function offsetsAreEqual(a: Offset, b: Offset): boolean {
   return (
      a.entityId.systemId === b.entityId.systemId &&
      a.entityId.publicId === b.entityId.publicId &&
      a.index === b.index &&
      a.row === b.row &&
      a.column === b.column
   );
}

export { offsetsAreEqual };
