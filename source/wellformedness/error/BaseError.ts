/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { Offset } from 'basic';
import { StringBundle } from './StringBundle';
import { SToken } from 'sToken';

const ERROR_TYPE = 'ERROR_TYPE';

type Position = SToken | Offset | undefined;

interface MessageCache {
   code: { [id: string]: number };
   message: StringBundle;
}

function isSToken(candidate: Position): candidate is SToken {
   return !!candidate && 'originalStr' in candidate;
}

/**********************************************************************\
 BaseError is a base type for all error objects.

 This provides common properties and construction logic for setting
 up properties for all errors.  Subclasses are expected to set
 a subtype property that distinguish them from other error types
 and an ID property that contains a mapping of error identifiers to
 strings of the same (thus allowing something like
   new MyError(MyError.ID.BAD_ERROR, ...);

 CONSTRUCTOR PARAM
 msgCache: An object containing a map of error id's to their codes, and
   a StringBundle with localized versions of the messages
 id: The error id
 params: Optional. An array of values that should be substituted into
    the message corresponding message from the msgCache
 place: An Offset or a SToken
    Speifies where the error happened in the original text (before
    line ending handling etc).
    If an Offset is specified, it will be copied and used directly.
    If a SToken is specified, it's endOffset will be used.
 contextOffset: an Offset, a single SToken, or undefined.
    Specifies the start of each hierarchical syntactic entity we are
    in the middle of parsing. So, if we are parsing &foo; and foo
    references &bar; and &bar; references %badName;, this should
    be "badName". If a SToken is specified, its startOffset will
    be used.

 Most properties are identical to their construction parameters.
 The context property, however, will initially be an array (either
 empty or with the contextOffset). Other parts of the system may
 add in other contexts in the chain of references that lead to this
 error.
\**********************************************************************/

class BaseError {
   public readonly type: typeof ERROR_TYPE = ERROR_TYPE;

   public readonly id: string;

   public readonly code: number;

   public readonly message: string;

   public readonly place: Offset | undefined;

   public readonly context: Array<Offset>;

   constructor(
      msgCache: MessageCache,
      id: string,
      params?: Array<string>,
      place?: Position,
      contextOffset?: Position,
   ) {
      this.id = id;

      params = params || [];

      if (isSToken(place)) {
         place = place.ranges[0].getEndOffset();
      } else if (place instanceof Offset) {
         place = place.clone();
      }

      if (contextOffset) {
         if (isSToken(contextOffset)) {
            contextOffset = contextOffset.ranges[0].getStartOffset();
         } else {
            // offset
            contextOffset = contextOffset.clone();
         }
      }

      if (!msgCache.code[id]) {
         const message = 'The Error id "' + id + '" is not a legal id.';

         throw Error(message);
      }

      this.code = msgCache.code[id];
      this.message = msgCache.message.substitute(id, params, 'base') || '';
      this.place = place ? place.clone() : undefined;
      this.context = contextOffset ? [contextOffset] : [];
   }
}

export { ERROR_TYPE, BaseError, MessageCache, Position };
