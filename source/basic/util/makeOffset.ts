import { SToken, getStartOffset, isSToken } from 'sToken';
import { Offset } from '../klass/offset';

function makeOffset(place?: Offset | SToken): Offset | undefined {
   if (isSToken(place)) {
      return getStartOffset(place);
   } else if (place) {
      return place.clone();
   }
}
export { makeOffset };
