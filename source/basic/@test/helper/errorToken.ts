/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import Offset from '../../Offset';
import { makeOffset } from '../../error/makeOffset';
import {
   XML_ERROR_TOKEN,
   XmlErrorPosition,
   XmlErrorToken,
   ERROR_SUBTYPE,
} from '../../error/XmlErrorToken';

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
      this.code = 123;
      this.context = makeOffset(context);
      this.message = 'this is a test';
      this.place = makeOffset(place);
   }
}

export { ErrorToken };
