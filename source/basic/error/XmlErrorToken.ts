/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken, getStartOffset, isSToken } from 'sToken';
import Offset from '../Offset';

const XML_ERROR_TOKEN = 'ERROR_TYPE';

type XmlErrorPosition = Offset | SToken;

interface XmlErrorToken {
   readonly code: number;
   readonly context?: Offset;
   readonly id: string;
   readonly message: string;
   readonly place?: Offset;
   readonly subtype: string;
   readonly type: typeof XML_ERROR_TOKEN;
}

function makeOffset(place?: Offset | SToken): Offset | undefined {
   if (isSToken(place)) {
      return getStartOffset(place);
   } else if (place) {
      return place.clone();
   }
}

export { XML_ERROR_TOKEN, XmlErrorPosition, XmlErrorToken, makeOffset };
