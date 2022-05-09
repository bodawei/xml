/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { fatalError } from './fatalError';
import {
   ERROR_SUBTYPE,
   Offset,
   makeOffset,
   XML_ERROR_TOKEN,
   XmlErrorPosition,
   XmlErrorToken,
} from 'basic';

class WellFormedError implements XmlErrorToken {
   public readonly code: number;

   public readonly context?: Offset;

   public readonly id: string;

   public readonly message: string;

   public readonly place?: Offset;

   public readonly subtype: typeof ERROR_SUBTYPE = ERROR_SUBTYPE;

   public readonly type: typeof XML_ERROR_TOKEN = XML_ERROR_TOKEN;

   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: XmlErrorPosition,
      context?: XmlErrorPosition,
   ) {
      this.id = id;
      this.code = fatalError.codeFor(id);
      this.context = makeOffset(context);
      this.message = fatalError.messageFor(id, params);
      this.place = makeOffset(place);
   }
}

export { WellFormedError };
