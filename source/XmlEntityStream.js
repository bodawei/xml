/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const stream = require('readable-stream');

const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');


class StreamHandler {

   constructor(listener, entityManager, entityStartToken) {
      this._listener = listener;
      this._entityManager = entityManager;
      this._entityStartToken = entityStartToken;

      this._queue = [];
      this._errorQueue = [];
      this._onData = this._onData.bind(this);
      this._onError = this._onError.bind(this);
      this._onEnd = this._onEnd.bind(this);

      this.ended = false;
   }

   start() {

      const cursor = this._entityManager.getEntity(this._entityStartToken.name); // don't we need to clean this up?

      if (cursor) {
         this._stream = new XmlTokenStream(cursor, this._entityManager, {
            lax: true   // this may not be right.
         });
         this._stream.addListener('data', this._onData);
         this._stream.addListener('error', this._onError);
         this._stream.addListener('end', this._onEnd);
         this._entityStartToken.haveEntityData = true;
      } else {
         const firstChunk = this._entityStartToken.chunks[0];
         this._errorQueue.push(new SyntaxError(SyntaxError.ID.REFERENCE_NO_DECLARATION, [ this._entityStartToken.name ],
            firstChunk, firstChunk, firstChunk.entityLocation));
         this.ended = true;
      }
   }

   _onEnd() {
      this._stream.removeListener('data', this._onData);
      this._stream.removeListener('error', this._onError);
      this._stream.removeListener('end', this._onEnd);
      delete this._stream;
      this.ended = true;
      this._listener.handlerChange(this); // repetiation
   }

   getNextError() {
      return this._errorQueue.shift();
   }

   getNext() {
      return this._queue.shift();   // beware may be undefined
   }

}

class EntityStreamHandler extends StreamHandler {

   constructor(listener, entityManager, entityStartToken) {
      super(listener, entityManager, entityStartToken)
   }

   _onData(token) {
      this._queue.push(token);

      this._listener.handlerChange(this);
   }

   _onError(error) {
      this._errorQueue.push(error);

      this._listener.handlerChange(this);
   }

}


class BaseStreamHandler {
   constructor(listener) {
      this._listener = listener;
      this._queue = [];
   }

   add(token, callback) {
      this._queue.push({
         token,
         callback
      });

      this._listener.handlerChange(this);
   }

   getNext() {
      if (this._pending) {
         this._pending.callback();
      }
      this._pending = this._queue.shift();  // check and error

      return this._pending ? this._pending.token : undefined;
   }
}

class XmlEntityStream extends stream.Transform {

   constructor(entityManager) {
      super({
         objectMode: true
      });

      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      this._entityManager = entityManager;
      this._baseStreamHandler = new BaseStreamHandler(this);
      this._handlerStack = [ this._baseStreamHandler ];
   }

   _transform(token, encoding, callback) {
      this._baseStreamHandler.add(token, callback);
   }

   handlerChange(handler) {
      if (this._inprogress) {
         return;
      }
      if (handler !== this._handlerStack[0]) {
         return;
      }
      this._inprogress = true;

      if (handler.getNextError) {
         let nextError = handler.getNextError();
         while (nextError) {
            this.emit('error', nextError);
            nextError = handler.getNextError();
         }
      }

      let nextToken = handler.getNext();
      while (nextToken) {
         let skipPush = false;
         if (nextToken instanceof tokens.EntityStart) {
            // I probably don't need to be doing the separate create and start here
            handler = new EntityStreamHandler(this, this._entityManager, nextToken);
            this._handlerStack.unshift(handler);
            handler.start();
         } else if (nextToken instanceof tokens.ElementStart && !nextToken.__hack_working) {
            nextToken.__hack_working = true;
            skipPush = true;
            handler = new ElementStreamHandler(this, this._entityManager, nextToken);
            this._handlerStack.unshift(handler);
            handler.start();
         }

         if (!skipPush) {
            this.push(nextToken);
         }

         nextToken = handler.getNext();
      }

      if (handler.ended) {
         this._handlerStack.shift();
         const handler = this._handlerStack[0];

         this._inprogress = false;  // can we turn this into an inner loop?
         this.handlerChange(handler);
      }

      this._inprogress = false;
   }

}

module.exports = XmlEntityStream;




class ElementStreamHandler {

   constructor(listener, entityManager, startElementToken) {
      this._listener = listener;
      this._entityManager = entityManager;
      this._queue = [];

      this.ended = false;

      this.startElementToken = startElementToken;
      this._working = {};
      this._workingCount = 0;

      this._endedCount = 0;
   }

   start() {
      let elementContext;

      for (let attrIndex = 0; attrIndex < this.startElementToken.attributes.length; attrIndex++) {
         const attribute = this.startElementToken.attributes[attrIndex];

         for (let index = 0; index < attribute.value.length; index++) {
            if (attribute.value[index] instanceof tokens.EntityStart) {
               const handler = new AttributeEntityStreamHandler(this, this._entityManager, attribute.value[index]);
               this._working[attrIndex + '.' + index] = handler;
               this._workingCount ++;
               handler.start();
            }
         }
      }

      if (this._workingCount === 0) {
         this._allDone();
      }
   }

   handlerChange(handler) {
      this._workingCount --;

      if (this._workingCount === 0) {
         this._allDone();
      }
   }

   _allDone() {
      for (let attrIndex = 0; attrIndex < this.startElementToken.attributes.length; attrIndex++) {
         const attribute = this.startElementToken.attributes[attrIndex];
         const newAttributeValue = [];

         for (let index = 0; index < attribute.value.length; index++) {
            const valuePiece = attribute.value[index];

            newAttributeValue.push(valuePiece);

            if (valuePiece instanceof tokens.EntityStart) {
               const handler = this._working[attrIndex + '.' + index];
               // @@@errors
               let piece = handler.getNext();
               while (piece) {
                  newAttributeValue.push(piece);
                  piece = handler.getNext();
               }
            }
         }

         attribute.value = newAttributeValue;
      }

      this.ended = true;
      this._queue.push(this.startElementToken);
      this._listener.handlerChange(this); // repetiation
   }

   getNext() {
      return this._queue.shift();   // beware may be undefined
   }

}

class AttributeEntityStreamHandler extends StreamHandler {

   constructor(listener, entityManager, entityStartToken) {
      super(listener, entityManager, entityStartToken)
   }

   _onData(token) {
      this._queue.push(token);
   }

   _onError(error) {
      this._errorQueue.push(error);
   }

}



//class Context {
//
//   constructor() {
//      this.data = [];
//      this.ended = false;
//   }
//
//   respondToEnd() {
//      // by default, a no-op
//   }
//
//   setupHandlers(stream, entityStream) {
//      const self = this;
//
//      function dataHandler(error, data) {
//         self.data.push(error || data);
//
//         entityStream._tokenLoop();
//      }
//
//      function endHandler() {
//         self.ended = true;
//         self.respondToEnd();
//
//         stream.off('data', dataHandler);
//         stream.off('end', endHandler);
//      }
//
//      stream.on('data', dataHandler);
//      stream.on('end', endHandler);
//   }
//
//}
//
//class ContentContext extends Context {
//
//   constructor(cursor, stream, startToken) {
//      super();
//
//      this.cursor = cursor;
//      this.stream = stream;
//      this.start = startToken;
//   }
//
//}
//
//class ElementContext extends Context {
//
//   constructor(startElementToken, contentContext) {
//      super();
//
//      this.token = startElementToken;
//      this.attrContexts = [];
//      this.contentContext = contentContext;
//   }
//
//}
//
//class AttributeContext extends Context {
//
//   constructor(attribute, elementContext, entityStream) {
//      super();
//
//      this.attribute = attribute;
//      this.value = attribute.value;
//      this.index = 0;
//      this.elementContext = elementContext;
//      this.entityStream = entityStream;
//   }
//
//   /*
//    * Walk through attribute until we find an entity, then set up
//    * potentially async retrieval of that entity. If no entity declaration
//    * found, add an error. if no entities wrap up
//    */
//   expandAttribute() {
//      let piece;
//
//      while (!piece && this.index < this.value.length) {
//         this.data.push(this.value[this.index]);
//
//         if (this.value[this.index] instanceof tokens.EntityStart) {
//            piece = this.value[this.index];
//         }
//
//         this.index ++;
//      }
//
//      if (this.index >= this.value.length) {
//         this.ended = true;
//         this.finallyDone();
//         return;
//      }
//
//      const cursor = this.entityStream._entityManager.getEntity(piece.name);
//
//      if (cursor) {
//         piece.haveEntityData = true;
//         this.cursor = cursor;
//         this.stream = new XmlTokenStream(cursor, this.entityStream._entityManager, {
//            lax: this.entityStream._options.lax
//         });
//
//         this.setupHandlers(this.stream, this.entityStream);
//      } else {
//         reportError(SyntaxError.ID.REFERENCE_NO_DECLARATION, piece, this.elementContext.contentContext);
//         // And continue processing.
//         this.expandAttribute();
//      }
//   }
//
//   respondToEnd() {
//      this.expandAttribute();
//   }
//
//   finallyDone() {
////      let attrContextStillWorking = false;
//
//      this.cursor = undefined;
//      this.stream = undefined;
//
//      this.attribute.value = this.data;
//
//      for (let index = 0; index < this.elementContext.attrContexts.length; index++) {
//         //         const attrContext = this.elementContext.attrContexts[index];
//         // if (!attrContext.ended) {
//         //    attrContextStillWorking = true;
//         // }
//      }
//
//      // if (!attrContextStillWorking) {
//      this.elementContext.ended = true;
//      this.entityStream._tokenLoop();
//      // }
//   }
//
//}
//
//function reportError(id, token, context) {
//   const offset = token.chunks ? token.chunks[0].startOffset : undefined;
//
//   context.data.unshift(new SyntaxError(SyntaxError.ID.REFERENCE_NO_DECLARATION, [ token.name ],
//      offset, offset));
//}
//
//class XmlEntityStreamOld extends XmlStream {
//
//   // This will inherit the laxness of the tokenStream, unless options is specified
//   constructor(tokenStream, entityManager, options) {
//      super(options);
//
//      if (!tokenStream || !tokenStream.on) {
//         throw Error('The tokenStream must have an on() function.');
//      }
//      if (!entityManager) {
//         throw Error('Must provide an XmlEntityManager instance.');
//      }
//
//      this._entityManager = entityManager;
//      this._contexts = [
//         new ContentContext(tokenStream._cursor, tokenStream)
//      ];
//      this._options = options || tokenStream._options;   // EEW
//
//      this._contexts[0].setupHandlers(tokenStream, this);
//   }
//
//   /**********************************************************************\
//    getNext() returns the next data (token or error), if any, or returns
//    undefined
//
//    RETURN
//    XmlToken, SyntaxError or undefined
//   \**********************************************************************/
//
//   _innerGetNext() {
//      const currentContext = this._contexts[this._contexts.length - 1];
//
//      if (currentContext.data.length > 0) {
//         const token = currentContext.data.shift();
//
//         if (token instanceof tokens.EntityStart) {
//            const cursor = this._entityManager.getEntity(token.name);
//
//            if (cursor) {
//               const stream = new XmlTokenStream(cursor, this._entityManager, {
//                  lax: this._options.lax
//               });
//               const context = new ContentContext(cursor, stream, token);
//               this._contexts.push(context);
//               context.setupHandlers(stream, this);
//               token.haveEntityData = true;
//            } else {
//               reportError(SyntaxError.ID.REFERENCE_NO_DECLARATION, token, currentContext);
//            }
//         } else if (token instanceof tokens.ElementStart || token instanceof tokens.EmptyElement) {
//            let elementContext;
//
//            for (let attrIndex = 0; attrIndex < token.attributes.length; attrIndex++) {
//               const attribute = token.attributes[attrIndex];
//               let startEntityIndex = -1;
//
//               for (let index = 0; index < attribute.value.length; index++) {
//                  if (attribute.value[index] instanceof tokens.EntityStart) {
//                     startEntityIndex = index;
//                     break;
//                  }
//               }
//
//               if (startEntityIndex !== -1) {
//                  if (!elementContext) {
//                     elementContext = new ElementContext(token, currentContext);
//                     this._contexts.push(elementContext);
//                  }
//
//                  const attrContext = new AttributeContext(attribute, elementContext, this);
//                  elementContext.attrContexts.push(attrContext);
//                  attrContext.expandAttribute();
//               }
//            }
//
//            if (elementContext) {
//               return;
//            }
//         } else if (token instanceof XmlError) {
//            // add the hierarchical context of the error.
//            const contexts = token.context.slice(0);
//
//            // we don't need to look at index 0, as it will never have a start
//            for (let index = this._contexts.length - 1; index > 0; index--) {
//               contexts.push({
//                  offset: this._contexts[index].start.chunks[0].startOffset,
//                  location: this._contexts[index - 1].cursor.entityMd.location
//               });
//            }
//            token.context = contexts;
//         }
//
//         return token;
//      } else if (currentContext.ended) {
//         if (currentContext instanceof ElementContext) {
//            this._contexts.pop();
//            return currentContext.token;
//         }
//
//         this._contexts.pop();
//         if (this._contexts.length > 0) {
//            return this._innerGetNext();
//         } else {
//            this._setEnded();
//         }
//      }
//   }
//
//}
