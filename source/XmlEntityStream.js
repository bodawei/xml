/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlStream = require('./XmlStream.js');

class XmlEntityStream extends XmlStream {

   constructor(tokenStream, entityManager, options) {
      super(options);
      if (!tokenStream || !tokenStream.on) {
         throw Error('The tokenStream must have an on() function.');
      }

      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      const context = {
         stream: tokenStream,
         data: []
      };

      this._contexts = [];
      this._entityManager = entityManager;
      this._contexts.push(context);

      tokenStream.on('data', (error, data) => {
         context.data.push(error || data);
         this._tokenLoop();
      });

   }

   /**********************************************************************\
    getNext() returns the next data (token or error), if any, or returns
    undefined

    RETURN
    XmlToken, XmlErrorToken or undefined
   \**********************************************************************/

   _innerGetNext() {
      const currentContext = this._contexts[this._contexts.length - 1];

      if (currentContext.data.length > 0) {
         return currentContext.data.shift();
      }
   }

/*
   // no strict and lax yet or exceptions
   // Improved algorithm.

   read() {
      if (!currentStream) {
         return;
      }
      let token = currentStream.read();

      if (token) {
         this._handleToken(); // my switch streams
         return token;
      }

      if (currentStream.atEOF()) {
         currentStream = stramStack.pop();
         return this._read();
      }

      return;
   }

   _tokenLoop(subStream) {
      if (subStream !== currentStream) {
         return;
      }

      // We could get called while we are already in a loop
      if (this._looping) {
         return;
      }
      this._looping = true;

      while (this._looping) {
         const token = this._read();

         if (token) {
            notifySubscribers(token);
         } else {
            this._looping = false;
         }
      }
   }

   // testing
   should be able to iteratively read() through a cursor
   should get all tokens via an on() event
   should be able to do a read while in an event handler and read token
   read should be able to start an async case, thus return nothing,
      and a subsequent read should not start another

*/
}

module.exports = XmlEntityStream;
