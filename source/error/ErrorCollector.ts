/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { Offset, EntityId } from 'basic';

import { SToken } from 'sToken';

type Position = SToken | Offset | void;

declare class ErrorToken {
   public readonly id: string;
   constructor(id: string, params: Array<string>, position: Position, context: Position);
};

type ErrConstFunc = typeof ErrorToken;

/**********************************************************************\
 An ErrorCollector collects a set of errors together in an array
 (retrievable with getErrors()). It provides various convenience
 routines to make it easy to create an error.

 Because Errors carry a fair bit of contextual information, one of
 the primary purposes of the ErrorCollector is to reduce the
 repetitive specification of that information.

 Ordinarily, an error contains, in addition to the ID and any
 parameters associated with that error, the position that the error
 occurred, and the overall context that the error occurred in. For
 example:
   <?xml VERSION="1.1" ?>
 In this case, the error is that the "version" should not be upper
 case, so the position of the error is 6 characters in. But,
 the context is the start of the XML Declaration, at 0 chars in.

 Sometimes the position can be difficult to compute for the callers.
 For instance, if a quote is missing but the previous couple STokens
 have been missing as well, it can get laborious to specify the
 best position.  This uses a heuristic which seems to always work,
 which is that when setPos() is called with a good SToken it is assumed
 the position for the next errors are at the start of that SToken.
 but if setPos() is called with undefined (a missing SToken), then
 the end of the most recently set SToken will be used for the next
 errors instead.
\**********************************************************************/

class ErrorCollector {
   private ErrorConstructor: ErrConstFunc;
   private context: Position;
   private position: SToken;
   private posStart: boolean;
   public errors: Array<ErrorToken>;

   constructor(context: SToken, ErrorConstructor: ErrConstFunc) {
      this.ErrorConstructor = ErrorConstructor;
      this.context = context;
      this.position = context;
      this.posStart = true;
      this.errors = [];
   }

   setPos(currentSToken?: SToken | void) {
      this.posStart = !!currentSToken;

      if (currentSToken) {
         this.position = currentSToken;
      }
   }

   getErrors() {
      return this.errors;
   }

   check(truthy: any, code: string, params?: Array<string>, position?: Position) {
      if (truthy) {
         this.report(code, params, position);
      }
   }

   report(code: string, params: Array<string> = [], position?: Position) {
      this.reportError(code, this.ErrorConstructor, params, position);
   }

   reportError(code: string, constructor: ErrConstFunc, params: Array<string>, position?: Position) {
      let posOffset: Offset;

      if (position instanceof Offset) {
         posOffset = position.clone();
      } else if (position) {
         posOffset = position.ranges[0].getStartOffset();
      } else {
         if (this.position) {
            posOffset = this.posStart ?
               this.position.ranges[0].getStartOffset() :
               this.position.ranges[0].getEndOffset();
         } else {
            posOffset = new Offset(new EntityId(), 0, 0, 0);
         }
      }

      this.errors.push(new constructor(code, params, posOffset, this.context));
   }

   appendFrom(other: ErrorCollector) {
      this.errors = this.errors.concat(other.getErrors());
   }
}

export default ErrorCollector;
