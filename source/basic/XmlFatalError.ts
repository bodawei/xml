/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { StringBundle } from './StringBundle';

import messagesAndStrings from './derive/XmlFatalError.json';
import { BaseError, MessageCache, Position } from './BaseError';

const XML_FATAL_ERROR_SUBTYPE = 'XML_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
};

class XmlFatalError extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;

   public static readonly MSG_BUNDLE = messages.message;

   public readonly subtype: typeof XML_FATAL_ERROR_SUBTYPE = XML_FATAL_ERROR_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export { XML_FATAL_ERROR_SUBTYPE, XmlFatalError };
