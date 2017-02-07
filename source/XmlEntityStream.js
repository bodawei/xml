/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const stream = require('readable-stream');

const tokens = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');

class EntityStreamHandler {

   constructor(listener, entityManager, entityStartToken) {
      this._listener = listener;
      this._queue = [];
      this._errorQueue = [];
      this._onData = this._onData.bind(this);
      this._onError = this._onError.bind(this);
      this._onEnd = this._onEnd.bind(this);

      this.ended = false;

      const cursor = entityManager.getEntity(entityStartToken.name); // don't we need to clean this up?

      if (cursor) {
         this._stream = new XmlTokenStream(cursor, entityManager, {
            lax: true   // this may not be right.
         });
         this._stream.addListener('data', this._onData);
         this._stream.addListener('error', this._onError);
         this._stream.addListener('end', this._onEnd);

         entityStartToken.haveEntityData = true;
      } else {
         //this._errorQueue.push(SyntaxError.ID.REFERENCE_NO_DECLARATION, entityStartToken); // context
         this.ended = true;
      }
   }

   _onData(token) {
      this._queue.push(token);

      this._listener.handlerChange(this);
   }

   _onError(error) {
      this._errorQueue.push(error);

      this._listener.handlerChange(this);
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
      return this._errorQueue.pop();
   }

   getNext() {
      this._pending = this._queue.pop();  // check and error
      return this._pending ? this._pending.token : undefined;   // beware may be undefined
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
      this._pending = this._queue.pop();  // check and error
      return this._pending ? this._pending.token : undefined;   // beware may be undefined
   }

   cleanup() {
      this._pending.callback();
      delete this._pending;
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
      if (handler !== this._handlerStack[0]) {
         return;
      }

      if (handler.getNextError) {
         let nextError = handler.getNextError();
         while (nextError) {
            this.emit('error', nextError);
            nextError = handler.getNextError();
         }
      }

      let nextToken = handler.getNext();
      while (nextToken) {
         if (nextToken instanceof tokens.EntityStart) {
            this._handlerStack.unshift(new EntityStreamHandler(this, this._entityManager, nextToken));
            this.push(nextToken);
            break;   // think about weird conditions you get the start. Maybe this hsould be return
         }

         this.push(nextToken);

         if (handler.cleanup) {
            handler.cleanup();
         }

         nextToken = handler.getNext();
      }

      if (handler.ended) {
         this._handlerStack.shift();
         const handler = this._handlerStack[0];

         if (handler.cleanup) {
            handler.cleanup();
         }

         this.handlerChange(handler);
      }
   }
}

module.exports = XmlEntityStream;

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
