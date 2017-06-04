/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/**********************************************************************\
\**********************************************************************/

class ErrorCollector {

  // unless otherwise specified, this means all err.foo()'s have openChunk as the context
  constructor(context, ErrorConstructor) {
      this._ErrorConstructor = ErrorConstructor;
      this._context = context;
      this._position = context;
      this._posStart = true;
      this._errors = [];
   }

   setPos(currentChunk) {
      if (currentChunk) {
         this._position = currentChunk;
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
      let posOffset;

      if (position) {
         posOffset = position.range[0].getStartOffset();
      } else {
         posOffset = this._posStart ? this._position.range[0].getStartOffset() : this._position.range[0].getEndOffset();
      }

      this._errors.push(new this._ErrorConstructor(code, params, posOffset, this._context));
   }
}

module.exports = ErrorCollector;
