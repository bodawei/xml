import { getSTokenStartOffset, SToken, isSToken } from 'basic';

import { Offset } from '../util/offset';

function makeOffset(place?: Offset | SToken): Offset | undefined {
   if (isSToken(place)) {
      return getSTokenStartOffset(place);
   } else if (place) {
      return new Offset(place);
   }
}
export { makeOffset };
