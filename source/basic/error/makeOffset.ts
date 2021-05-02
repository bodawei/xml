import { SToken, getStartOffset, isSToken } from 'sToken';
import Offset from '../Offset';

function makeOffset(place?: Offset | SToken): Offset | undefined {
   if (isSToken(place)) {
      return getStartOffset(place);
   } else if (place) {
      return place.clone();
   }
}
export { makeOffset };
