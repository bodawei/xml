/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { errorCodes } from './errorCodes';

import {
   ERROR_SUBTYPE,
   Offset,
   makeOffset,
   XML_ERROR_TOKEN,
   XmlErrorPosition,
   XmlErrorToken,
} from 'basic';

class ErrorToken implements XmlErrorToken {
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
      this.code = errorCodes.codeFor(id);
      this.context = makeOffset(context);
      this.message = errorCodes.messageFor(id, params);
      this.place = makeOffset(place);
   }
}

export { ErrorToken };
