/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import {
   WARNING_SUBTYPE,
   makeOffset,
   Offset,
   XML_ERROR_TOKEN,
   XmlErrorPosition,
   XmlErrorToken,
} from 'basic';
import { wellFormedWarningCodes } from './wellFormedWarningCodes';

class WellFormedWarning implements XmlErrorToken {
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
      this.code = wellFormedWarningCodes.codeFor(id);
      this.context = makeOffset(context);
      this.message = wellFormedWarningCodes.messageFor(id, params);
      this.place = makeOffset(place);
   }
}

export { WellFormedWarning };
