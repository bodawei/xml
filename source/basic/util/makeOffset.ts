import { SToken, getStartOffset, isSToken } from 'sToken';

import { Offset } from '../util/offset';

function makeOffset(place?: Offset | SToken): Offset | undefined {
   if (isSToken(place)) {
      return getStartOffset(place);
   } else if (place) {
      return new Offset(place);
   }
}
export { makeOffset };
