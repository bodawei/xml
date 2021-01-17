/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { StringBundle } from 'basic';
import { BaseError, ErrorLocale, MessageCache, Position } from 'basic';

import validtyErrorStrings from './derive/ValidityError.json';

const messagesAndStrings: ErrorLocale = validtyErrorStrings;

const VALIDITY_ERROR_SUBTYPE = 'VALIDITY_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
};

class ValidityError extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;

   public static readonly MSG_BUNDLE = messages.message;

   public readonly subtype: typeof VALIDITY_ERROR_SUBTYPE = VALIDITY_ERROR_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export { VALIDITY_ERROR_SUBTYPE, ValidityError };
