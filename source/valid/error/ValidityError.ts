/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { makeOffset, XmlErrorToken } from 'basic';
import { XML_ERROR_TOKEN, Offset, XmlErrorPosition } from 'basic';
import { validCodes } from './validCodes';

const VALIDITY_ERROR_SUBTYPE = 'VALIDITY_ERROR';

class ValidityError implements XmlErrorToken {
   public readonly code: number;

   public readonly context?: Offset;

   public readonly id: string;

   public readonly message: string;

   public readonly place?: Offset;

   public readonly subtype: typeof VALIDITY_ERROR_SUBTYPE = VALIDITY_ERROR_SUBTYPE;

   public readonly type: typeof XML_ERROR_TOKEN = XML_ERROR_TOKEN;

   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: XmlErrorPosition,
      context?: XmlErrorPosition,
   ) {
      this.id = id;
      this.code = validCodes.codeFor(id);
      this.context = makeOffset(context);
      this.message = validCodes.messageFor(id, params);
      this.place = makeOffset(place);
   }
}

export { VALIDITY_ERROR_SUBTYPE, ValidityError };
