/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { StringBundle } from '../basic';

// @ts-ignore
import messagesAndStrings from './derive/XmlWarning.json';
import { BaseError, MessageCache, Position } from './BaseError';

const WARNING_SUBTYPE = 'WELL_FORMED_ERROR';
const messages: MessageCache = {
   code: messagesAndStrings.code,
   message: new StringBundle(messagesAndStrings.message),
}

/**********************************************************************\
 XmlWarning holds inforamtion about a warnings
\**********************************************************************/

class XmlWarning extends BaseError {
   public static readonly ID: { [id: string]: string } = messagesAndStrings.id;
   public readonly subtype: typeof WARNING_SUBTYPE = WARNING_SUBTYPE;

   constructor(id: string, params?: Array<string>, place?: Position, contextOffset?: Position) {
      super(messages, id, params, place, contextOffset);
   }
}

export {
   WARNING_SUBTYPE,
   XmlWarning,
};
