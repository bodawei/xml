/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { StringBundle } from '../basic';

// @ts-ignore
import messagesAndStrings from './derive/ValidityError.json';
import { BaseError, MessageCache, Position } from './BaseError';

const VALIDITY_ERROR_SUBTYPE = 'VALIDITY_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
}

/**********************************************************************\
 ValidityError holds inforamtion about a validity check error
\**********************************************************************/

class ValidityError extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;
   public readonly subtype: typeof VALIDITY_ERROR_SUBTYPE = VALIDITY_ERROR_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export {
   VALIDITY_ERROR_SUBTYPE,
   ValidityError,
};
