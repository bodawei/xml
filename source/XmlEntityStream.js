/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const stream = require('readable-stream');

const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');
const XmlError = require('./error/XmlError.js');
const XmlTokenStream = require('./XmlTokenStream.js');

/**********************************************************************\
 An XmlEntityStream is a Transform stream that accepts XmlTokens and
 Errors, and passes them through with these modifications:
   -  If a StartEntity is found in the incoming stream, this will
      attempt to expand that entity.
   -  If a StartElement or EmptyElement is found, and its attributes
      contain StartEntity tokens, attempt to expand those entities.
   -  Modify any XmlErrors to give more context about where they were
      found (relevant because an error may be found in an entity
      references from an entity referenced from ... the document.
\**********************************************************************/

class XmlEntityStream extends stream.Transform {

   constructor(entityManager, options = {}) {
      super({
         objectMode: true
      });

      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      this._options = {
         lax: options.lax || false
      };

      // baseStreamHandler will handle tokens written to this stream
      this._baseStreamHandler = new BaseStreamHandler();
      // Build a streamTreee handler which will process the tree of entities in the document
      this._streamTree = new TreeStreamHandler(this, this._baseStreamHandler, entityManager);
   }

   // Pass tokens written to use to the baseStreamHandler
   _transform(token, encoding, callback) {
      this._baseStreamHandler.add(token, callback);
   }

   // When the streamTree changes, pull out any tokens and pass them on.
   change(handler) {
      if (this._errored) {
         return;
      }
      let nextToken = handler.getNext();
      while (nextToken) {
         if (!this._options.lax && (nextToken instanceof Error || nextToken instanceof XmlError)) {
            this.emit('error', nextToken);
            this.push(null);
            this._errored = true;
            return;
         } else {
            this.push(nextToken);
            nextToken = handler.getNext();
         }
      }
   }

}

/**********************************************************************\
 A StreamHandler provides common functionality for handling streams
 of tokens and errors (data).
 
 All StreamHandlers:
   -  have a queue of 0 or more data items
   -  have an "ended" flag which is true when no more data will be
      delivered to the handler and the queue has been drained.
   -  will notify its "listener" by calling change() any time it
      queues something new into the available queue.
   -  will have getNext() called after the last data has been
      returned.

 Note: These are not implemented as Transform streams, though there
 are some significant similarities. The main reason is that for some
 StreamHandlers, we want to be able to gather all data before
 declaring any change. In other cases, we are merging a complex
 collection of other streams.
\**********************************************************************/

class StreamHandler {

   constructor(listener) {
      this._listener = listener;
      this._queue = [];
      this._ended = false;
   }

   get ended() {
      return this._ended && this._queue.length === 0;
   }

   getNext() {
      return this._queue.shift();
   }

}

/**********************************************************************\
 A BaseStreamHandler provides a Stream Handler that queues data from
 the EntityStreamHandler's input, and makes them available to its
 listener (which, in this context, is a TreeStreamHandler. Note that
 data from the EntityStreamHandler must have a callback called for
 each data item delivered.  This calls the callback, if present,
 when getNext() is called.
\**********************************************************************/

class BaseStreamHandler extends StreamHandler {

   constructor(listener) {
      super(listener);

      this._pending = undefined;
   }

   setListener(newListener) {
      this._listener = newListener;
   }

   add(token, callback) {
      if (!token) {
         this._ended = true;
      } else {
         this._queue.push({
            token,
            callback
         });
      }

      this._listener.change(this);
   }

   // override parent's getNext()
   getNext() {
      if (this._pending && this._pending.callback) {
         this._pending.callback();
         // note: it is not uncommon for add() to be called while in callback()
      }
      this._pending = this._queue.shift();

      return this._pending ? this._pending.token : undefined;
   }
}

/**********************************************************************\
 TreeStreamHandler is a very special stream handler, which also
 provides the heart of the functionality needed by the XmlEntityStream.
 
 It listens to N different StreamHandlers at the same time. You can
 think of the data emerging from a StreamHandler as a node in a tree.
 Some of the data items in each node may be EntityStart or ElementStart
 and so form a branch on the tree.  This does a depth-first traversal
 of those nodes (and sequential processing of the data items in a
 node).  The result is a stream of data items where each entity,
 for example, has been expanded in place.
 
 For this to work, this keeps a stack of StreamHandler's, with each
 node in the stack processing independently. This allows us to
 parallel process several potentially asynchrounously retrieved
 external entities.
 
 The key point is that as each StreamHandler changes, it notifies this
 handler, and this will only respond to that change if it is the
 leafmost node at the current moment in processing. Otherwise, it
 ignores the change, letting the data be queued and it will retrieve
 those when it eventually pops back down to that StreamHandler.
\**********************************************************************/
class TreeStreamHandler extends StreamHandler {

   constructor(listener, firstHandler, entityManager) {
      super(listener);
      this._entityManager = entityManager;
      this._handlerStack = [ new HandlerContext(firstHandler) ];
      firstHandler.setListener(this);
   }

   get finished() {
      return this._handlerStack.length === 0;
   }

   change(handler) {
      /*
       * Some stream handlers may change while we are in the middle of processing them.
       * Do not respond at this time.
       */
      if (this._inProgress || handler !== this._handlerStack[0].handler) {
         return;
      }
      this._inProgress = true;

      let nextToken = handler.getNext();
      while (nextToken) {
         if (nextToken === this._handlerStack[0].firstToken) {
            // delete this._handlerStack[0].firstToken;
         } else if (nextToken instanceof tokens.EntityStart) {
            handler = new QueuedStreamHandler(this, this._entityManager, nextToken);
            this._handlerStack.unshift(new HandlerContext(handler, nextToken));
            nextToken = handler.getNext();
            continue;
         } else if (nextToken instanceof tokens.ElementStart || nextToken instanceof tokens.EmptyElement) {
            handler = new ElementStreamHandler(this, this._entityManager, nextToken);
            this._handlerStack.unshift(new HandlerContext(handler, nextToken));
            nextToken = handler.getNext();
            continue;
         } else if (nextToken instanceof XmlError) {
            // add the hierarchical context of the error.
            const contexts = nextToken.context.slice(0);

            // we don't need to look at the farthest index
            for (let index = 0; index < this._handlerStack.length - 1; index++) {
               if (this._handlerStack[index].firstToken.chunks) {
                  contexts.push({
                     offset: this._handlerStack[index].firstToken.chunks[0].startOffset,
                     location: this._handlerStack[index].firstToken.chunks[0].location
                  });
               }
            }
            nextToken.context = contexts;
         }

         this._queue.push(nextToken);
         this._listener.change(this);

         nextToken = handler.getNext();
      }

      this._inProgress = false;

      if (handler.ended) {
         this._handlerStack.shift();

         if (this._handlerStack.length > 0) {
            this.change(this._handlerStack[0].handler);
         } else {
            this._ended = true;
            // notify our parent handler that we might be done.
            this._listener.change(this);
         }
      }
   }

}

class HandlerContext {

   constructor(handler, firstToken) {
      this.handler = handler;
      this.firstToken = firstToken;
   }

}

/**********************************************************************\
 A QueuedStreamHandler uses the information in the provided
 EntityStart token to retrieve the specified entity, and start parsing
 its data into this handler's queue. If any errors are encountered,
 they are also added to the queue at the time that they are found.
 
 NOTE: This assumes it takes over the delivery of the EntityStart
 token.  This allows us to insert any errors if we can't find the
 entity before the start token is delivered.
\**********************************************************************/
class QueuedStreamHandler extends StreamHandler {

   constructor(listener, entityManager, entityStartToken) {
      super(listener);
      this._entityStartToken = entityStartToken;

      this._onData = this._onData.bind(this);
      this._onEnd = this._onEnd.bind(this);

      const cursor = entityManager.getEntity(this._entityStartToken.name);

      if (cursor) {
         this._stream = new XmlTokenStream(cursor, entityManager, {
            lax: true
         });
         this._stream.addListener('data', this._onData);
         this._stream.addListener('error', this._onData);
         this._stream.addListener('end', this._onEnd);
         this._entityStartToken.haveEntityData = true;
      } else {
         this._queue.push(new SyntaxError(SyntaxError.ID.REFERENCE_NO_DECLARATION, [ this._entityStartToken.name ]));
         this._ended = true;
      }

      this._queue.push(this._entityStartToken);
   }

   _onEnd() {
      this._stream.removeListener('data', this._onData);
      this._stream.removeListener('error', this._onData);
      this._stream.removeListener('end', this._onEnd);
      delete this._stream;
      this._ended = true;
      this._listener.change(this);
   }

   _onData(token) {
      this._queue.push(token);

      this._listener.change(this);
   }
}

/**********************************************************************\
 A StreamQueue maintains a queues of all data returned...
\**********************************************************************/
class ElementStreamHandler extends StreamHandler {

   constructor(listener, entityManager, startElementToken) {
      super(listener);

      this.startElementToken = startElementToken;

      this._working = {};
      this._workingCount = 0;

      for (let attrIndex = 0; attrIndex < this.startElementToken.attributes.length; attrIndex++) {
         const attribute = this.startElementToken.attributes[attrIndex];

         for (let index = 0; index < attribute.value.length; index++) {
            if (attribute.value[index] instanceof tokens.EntityStart) {
               const simpleHandler = new BaseStreamHandler();
               const handler = new TreeStreamHandler(this, simpleHandler, entityManager);
               simpleHandler.add(attribute.value[index]);
               simpleHandler.add(null);
               this._working[mkKey(attrIndex, index)] = handler;
               this._workingCount ++;
            }
         }
      }

      if (this._workingCount === 0) {
         this._allDone();
      }
   }

   change(handler) {
      if (handler.finished) {
         this._workingCount --;

         if (this._workingCount === 0) {
            this._allDone()
         }
      }
   }

   _allDone() {
      for (let attrIndex = 0; attrIndex < this.startElementToken.attributes.length; attrIndex++) {
         const attribute = this.startElementToken.attributes[attrIndex];
         const newAttributeValue = [];

         for (let index = 0; index < attribute.value.length; index++) {
            const valuePiece = attribute.value[index];

            if (valuePiece instanceof tokens.EntityStart) {
               const handler = this._working[mkKey(attrIndex, index)];
               let piece = handler.getNext();
               while (piece) {
                  if (piece instanceof Error) {
                     this._queue.push(piece);
                  } else {
                     newAttributeValue.push(piece);
                  }
                  piece = handler.getNext();
               }
            } else {
               newAttributeValue.push(valuePiece);
            }
         }

         attribute.value = newAttributeValue;
      }

      this._ended = true;
      this._queue.push(this.startElementToken);
      this._listener.change(this); // repetiation
   }
}

function mkKey(attributeIndex, tokenIndex) {
   return attributeIndex + '.' + tokenIndex;
}


module.exports = XmlEntityStream;



/*
TODO
√ - extract common stuff from tests
√ - deal with strict
- Add error context adding
- Finish documentation
- pass callbacks around rather than a class with a particular method name
- test read()
- need special token stream for attributes
*/
