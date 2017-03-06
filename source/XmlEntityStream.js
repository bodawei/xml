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
      attempt to expand that entity (retrieve and parse its content
      and insert immediately after the StartEntity token in the
      output).
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

      this._treeChanged = this._treeChanged.bind(this);
      // baseStreamHandler will handle tokens written to this stream
      this._baseStreamHandler = new BaseStreamHandler();
      // Build a streamTreee handler which will process the tree of entities in the document
      this._streamTree = new TreeStreamHandler(this._treeChanged, this._baseStreamHandler, entityManager);
   }

   // Pass tokens written to use to the baseStreamHandler
   _transform(token, encoding, callback) {
      this._baseStreamHandler.add(token, callback);
   }

   /*
    * When the streamTree changes, pull out any data and pass them on,
    * unless the next datum is an error and we are in strict mode,
    * in which case we report an error and mark ourselves as in an error.
    * Don't respond to any changes if we are in an error state.
    */
   _treeChanged(handler) {
//      if (this._errored) {
//         return;
//      }

      let nextToken = handler.getNext();
      while (nextToken) {
         if (!this._options.lax && nextToken instanceof XmlError) {
            this._streamTree.changeCallback = () => {}; // silence any callbacks
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
   -  will call the callback() any time it queues something new
      into the queue, or when it finds itself done.
   -  must have getNext() called after the last datum has been
      returned.

 Note: These are not implemented as Transform streams, though there
 are some significant similarities. The main reason is that for some
 StreamHandlers, we want to be able to gather all data before
 declaring any change. In general, it has looked like doing all with
 streams would add more "overhead" than is needed.
\**********************************************************************/

class StreamHandler {

   constructor(changeCallback) {
      this.changeCallback = changeCallback;
      this._queue = [];
      this._noMoreInput = false;
   }

   get ended() {
      return this._noMoreInput && this._queue.length === 0;
   }

   getNext() {
      return this._queue.shift();
   }

}

/**********************************************************************\
 A BaseStreamHandler provides a Stream Handler that receives data from
 some external source (either the XmlEntityStream itself, or the
 ElementStreamHandler.
 At the time of this writing, a BaseStreamHandler is always coupled
 with a TreeStreamHandler where it serves as the "root" of the tree.
\**********************************************************************/

class BaseStreamHandler extends StreamHandler {

   add(token, callback) {
      if (!token) {
         this._noMoreInput = true;
      } else {
         this._queue.push({
            token,
            callback
         });
      }

      this.changeCallback(this);
   }

   // Deliberately override parent's getNext()
   getNext() {
      if (this._pending && this._pending.callback) {
         this._pending.callback(); // reminder: it is not uncommon for add() to be called while in callback()
      }
      this._pending = this._queue.shift();

      return this._pending ? this._pending.token : undefined;
   }
}

/**********************************************************************\
 TreeStreamHandler is a very special stream handler, which also
 provides the heart of the functionality needed by the XmlEntityStream.

 It listens to N StreamHandlers at the same time, and folds the data
 from all of them together.

 Imagine an XmlEntityStream processing a stream of tokens from a
 document, where some of those tokens are entity starts, and some
 of the referenced entities reference still other entities. The
 document can then be pictured as a tree, where each node is an
 entity (the root node is the document entity). Each node is
 processed through a different StreamHandler, and the effect of the
 TreeStreamHandler is to do a depth-first traversal of this tree.

 This is biased to being doing as much of the processing in parallel
 as possible, so each node on the current path from root to the
 current node is actively retrieving data. The TreeStreamHandler
 will wait for the current node to deliver all of its data before
 moving back up to the parent node (which may still be processing,
 or already have completed retrieving and queuing all its data).

 The key point is that as each StreamHandler changes, it notifies this
 handler, and this will only respond to that change if it is the
 leafmost node at the current moment in processing.
\**********************************************************************/

class TreeStreamHandler extends StreamHandler {

   constructor(changeCallbackCallback, firstHandler, entityManager) {
      super(changeCallbackCallback);
      this._entityManager = entityManager;
      this._handlerStack = [ new HandlerFrame(firstHandler) ];
      this._childChanged = this._childChanged.bind(this);

      // The handler has to have been created before this is, so hook it up
      firstHandler.changeCallback = this._childChanged;
   }

   // True if all possible data has been processed through this.
   get treeFullyWalked() {
      return this._noMoreInput;
   }

   _peek() {
      return this._handlerStack[this._handlerStack.length - 1];
   }

   _childChanged(handler) {
      // Some stream handlers may change while we are in the middle of processing them. Lock 'em out!
      if (this._inProgress || handler !== this._peek().handler) {
         return;
      }
      this._inProgress = true;

      let nextToken = handler.getNext();
      while (nextToken) {
         if (nextToken === this._peek().firstToken) {
            // Do no further processing of this token, as we already handled it
         } else if (nextToken instanceof tokens.EntityStart) {
            handler = new QueuedStreamHandler(this._childChanged, this._entityManager, nextToken);
            this._handlerStack.push(new HandlerFrame(handler, nextToken));
            nextToken = handler.getNext();
            continue;
         } else if (nextToken instanceof tokens.ElementStart || nextToken instanceof tokens.EmptyElement) {
            handler = new ElementStreamHandler(this._childChanged, this._entityManager, nextToken);
            this._handlerStack.push(new HandlerFrame(handler, nextToken));
            nextToken = handler.getNext();
            continue;
         } else if (nextToken instanceof XmlError) {
            this._addErrorContext(nextToken);
         }

         this._queue.push(nextToken);
         this.changeCallback(this);

         nextToken = handler.getNext();
      }

      this._inProgress = false;

      if (handler.ended) {
         this._handlerStack.pop();

         if (this._handlerStack.length === 0) {
            this._noMoreInput = true;
            this.changeCallback(this);
         } else {
            this._childChanged(this._peek().handler);
         }
      }
   }

   _addErrorContext(nextToken) {
      nextToken.context = nextToken.context.slice(0);

      for (let index = this._handlerStack.length - 1; index >= 0; index--) {
         /*
          * Items in an attribute value will not have chunks, and base frams
          * won't have a token. We don't need data from these in those cases,
          * so we can freely skip them.
          */
         if (!this._handlerStack[index].firstToken || !this._handlerStack[index].firstToken.chunks) {
            continue;
         }

         nextToken.context.push({
            offset: this._handlerStack[index].firstToken.chunks[0].startOffset,
            location: this._handlerStack[index].firstToken.chunks[0].entityLocation
         });
      }
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

   constructor(changeCallbackCallback, entityManager, entityStartToken) {
      super(changeCallbackCallback);
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
         const error = new SyntaxError(SyntaxError.ID.REFERENCE_NO_DECLARATION, [ this._entityStartToken.name ]);

         if (entityStartToken.chunks) {
            const firstChunk = entityStartToken.chunks[0];
            error.place = firstChunk.startOffset;
         }

         this._queue.push(error);
         error.context = []; // UUUUUGLY. We'll add the context elsewhere. Without this, we get a duplicate.
         this._noMoreInput = true;
      }

      this._queue.push(this._entityStartToken);
   }

   _onEnd() {
      this._stream.removeListener('data', this._onData);
      this._stream.removeListener('error', this._onData);
      this._stream.removeListener('end', this._onEnd);
      delete this._stream;
      this._noMoreInput = true;
      this.changeCallback(this);
   }

   _onData(token) {
      this._queue.push(token);
      this.changeCallback(this);
   }
}

/**********************************************************************\
 An ElementStreamHandler processes a StartElement or EmptyElement
 token. Unlike a QueuedStreamHandler, however, it only processes a
 single token. The interesting task this does, however, is to examine
 all the attributes in the element, and if any contain entity
 references, this will expand those.

 For each of the N attributes, it will retrieve the 0 or more
 referenced entities at the same time. Each entity may, itself,
 reference others, and thus each individual entity reference forms
 a tree of tokens.
\**********************************************************************/
class ElementStreamHandler extends StreamHandler {

   constructor(changeCallbackCallback, entityManager, startElementToken) {
      super(changeCallbackCallback);

      this._startElementToken = startElementToken;
      this._working = {};
      this._workingCount = 0;

      this._treeChanged = this._treeChanged.bind(this);

      for (let attrIndex = 0; attrIndex < startElementToken.attributes.length; attrIndex++) {
         const attribute = startElementToken.attributes[attrIndex];

         for (let index = 0; index < attribute.value.length; index++) {
            if (!(attribute.value[index] instanceof tokens.EntityStart)) {
               continue;
            }

            const simpleHandler = new BaseStreamHandler();
            const handler = new TreeStreamHandler(this._treeChanged, simpleHandler, entityManager);
            simpleHandler.add(attribute.value[index]);
            simpleHandler.add(null); // No more input to provide.

            this._working[mkKey(attrIndex, index)] = handler;
            this._workingCount ++;
         }
      }

      this._checkIfDone();
   }

   _treeChanged(handler) {
      if (!handler.treeFullyWalked) {
         return;
      }

      this._workingCount --;
      this._checkIfDone();
   }

   _checkIfDone() {
      if (this._workingCount !== 0) {
         return;
      }

      // With all the data gathered, pour the final expanded data into the attributes
      for (let attrIndex = 0; attrIndex < this._startElementToken.attributes.length; attrIndex++) {
         const attribute = this._startElementToken.attributes[attrIndex];
         const newAttributeValue = [];

         for (let index = 0; index < attribute.value.length; index++) {
            const valuePiece = attribute.value[index];

            if (valuePiece instanceof tokens.EntityStart) {
               const handler = this._working[mkKey(attrIndex, index)];

               let piece = handler.getNext();
               while (piece) {
                  // Separate out errors and put before the start token.
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

      this._noMoreInput = true;
      this._queue.push(this._startElementToken);
      this.changeCallback(this); // repetiation
   }
}

class HandlerFrame {

   constructor(handler, firstToken) {
      this.handler = handler;
      this.firstToken = firstToken;
   }

}

function mkKey(attributeIndex, tokenIndex) {
   return attributeIndex + '.' + tokenIndex;
}

module.exports = XmlEntityStream;
