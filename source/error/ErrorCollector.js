/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

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
 For instance, if a quote is missing but the previous couple lTokens
 have been missing as well, it can get laborious to specify the
 best position.  This uses a heuristic which seems to always work,
 which is that when setPos() is called with a good lToken it is assumed
 the position for the next errors are at the start of that lToken.
 but if setPos() is called with undefined (a missing lToken), then
 the end of the most recently set lToken will be used for the next
 errors instead.
\**********************************************************************/

class ErrorCollector {

   constructor(context, ErrorConstructor) {
      this._ErrorConstructor = ErrorConstructor;
      this._context = context;
      this._position = context;
      this._posStart = true;
      this._errors = [];
   }

   setPos(currentLToken) {
      if (currentLToken) {
         this._position = currentLToken;
         this._posStart = true;
      } else {
         this._posStart = false;
      }
   }

   getErrors() {
      return this._errors;
   }

   check(truthy, code, params, position) {
      if (truthy) {
         this.report(code, params, position);
      }
   }

   report(code, params, position) {
      this.reportError(code, this._ErrorConstructor, params, position);
   }

   reportError(code, constructor, params, position) {
      let posOffset;

      if (position) {
         posOffset = position.range[0].getStartOffset();
      } else {
         posOffset = this._posStart ? this._position.range[0].getStartOffset() : this._position.range[0].getEndOffset();
      }

      this._errors.push(new constructor(code, params, posOffset, this._context));
   }
}

module.exports = ErrorCollector;
