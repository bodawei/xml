/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { StringBundle } from '../basic';

// @ts-ignore
import messagesAndStrings from './derive/WellFormedError.json';
import { BaseError, MessageCache, Position } from './BaseError';

const WELL_FORMED_ERROR_SUBTYPE = 'WELL_FORMED_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
}

/**********************************************************************\
 WellFormedError holds inforamtion about a syntax error
\**********************************************************************/

class WellFormedError extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;
   public readonly subtype: typeof WELL_FORMED_ERROR_SUBTYPE = WELL_FORMED_ERROR_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export {
   WELL_FORMED_ERROR_SUBTYPE,
   WellFormedError,
};
