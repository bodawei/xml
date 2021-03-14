/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { StringBundle } from 'basic';

import messagesAndStrings from './derive/XmlError.json';
import { BaseError, MessageCache, Position } from 'basic';

const XML_ERROR_SUBTYPE = 'XML_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
};

/**********************************************************************\
 XmlError holds inforamtion about a syntax error
\**********************************************************************/

class XmlError extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;

   public static readonly MSG_BUNDLE = messages.message;

   public readonly subtype: typeof XML_ERROR_SUBTYPE = XML_ERROR_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export { XML_ERROR_SUBTYPE, XmlError };
