/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { makeOffset } from '../error/makeOffset';
import Offset from '../Offset';
import {
   WARNING_SUBTYPE,
   XML_ERROR_TOKEN,
   XmlErrorPosition,
   XmlErrorToken,
} from '../error/XmlErrorToken';

class TestErrorType implements XmlErrorToken {
   public readonly code: number;

   public readonly context?: Offset;

   public readonly id: string;

   public readonly message: string;

   public readonly place?: Offset;

   public readonly subtype: typeof WARNING_SUBTYPE = WARNING_SUBTYPE;

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

export { TestErrorType };
