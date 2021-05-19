/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { XML_ERROR_TOKEN, XmlErrorPosition, XmlErrorToken, Offset, makeOffset } from 'basic';
import { validityConstraint } from './validityConstraint';

const VALID_ERROR_SUBTYPE = 'VALID_ERROR_SUBTYPE';

class ValidityConstraintToken implements XmlErrorToken {
   public readonly code: number;

   public readonly context?: Offset;

   public readonly id: string;

   public readonly message: string;

   public readonly place?: Offset;

   public readonly subtype: typeof VALID_ERROR_SUBTYPE = VALID_ERROR_SUBTYPE;

   public readonly type: typeof XML_ERROR_TOKEN = XML_ERROR_TOKEN;

   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: XmlErrorPosition,
      context?: XmlErrorPosition,
   ) {
      this.id = id;
      this.code = validityConstraint.codeFor(id);
      this.context = makeOffset(context);
      this.message = validityConstraint.messageFor(id, params);
      this.place = makeOffset(place);
   }
}

export { VALID_ERROR_SUBTYPE, ValidityConstraintToken };
