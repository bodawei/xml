/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlErrorToken = require('./XmlErrorToken.js');

const EVENT_NAMES = [ 'error', 'token', 'data' ];

class XmlEntityStream {

   constructor(tokenStream, entityManager) {
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
      this._handlers = {};
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

   getNext() {
      const currentContext = this._contexts[this._contexts.length - 1];

      if (currentContext.data.length > 0) {
         return currentContext.data.shift();
      }
   }

   /**********************************************************************\
    on() sets up an event handler that will be called on certain events.
    If this is called repeatedly with the same callback for the same event,
    subsequent ones will be ignored.

    PARAM
    eventName: The name of the event to listen to. one of: 'data',
      'error', or 'token'
    callback: The function to call on the specified event. The signature
      is function(error, token).
   \**********************************************************************/

   on(eventName, callback) {
      this._assertEventParams(eventName, callback);
      this._handlers[eventName] = this._handlers[eventName] || [];

      if (this._handlers[eventName].indexOf(callback) !== -1) {
         return;
      }

      this._handlers[eventName].push(callback);

      // Do not call loop immediately, as caller may want to set up multiple subscriptions before getting notified
      setTimeout(() => {
         this._tokenLoop();
      }, 0);
   }

   /**********************************************************************\
    off() removes an event handler that was set up with on().  If the
    handler isn't present, this silently does nothing.

    PARAM
    eventName: The name of the event to listen to. one of: 'data',
      'error', or 'token'
    callback: The function to call on the specified event. The signature
      is function(error, token).
   \**********************************************************************/

   off(eventName, callback) {
      this._assertEventParams(eventName, callback);

      if (!this._handlers[eventName]) {
         return;
      }

      const index = this._handlers[eventName].indexOf(callback);

      if (index !== -1) {
         this._handlers[eventName].splice(index, 1);
         if (this._handlers[eventName].length === 0) {
            delete this._handlers[eventName];
         }
      }
   }

   _assertEventParams(eventName, callback) {
      if (EVENT_NAMES.indexOf(eventName) === -1) {
         throw new Error('Event "' + eventName + '" is not known. Must be one of: ' + EVENT_NAMES.join(', ') + '.');
      }
      if (!(callback instanceof Function)) {
         throw new Error('Callback must be a function with signature "function(error, data)".');
      }
   }

   _notifyHandlersSuccess(eventName, data) {
      if (!this._handlers[eventName]) {
         return;
      }

      const handlers = this._handlers[eventName].slice(0); // make a copy in case list is modified.

      for (let index = 0; index < handlers.length; index++) {
         handlers[index](undefined, data);
      }
   }

   _notifyHandlersError(eventName, error) {
      if (!this._handlers[eventName]) {
         return;
      }

      const handlers = this._handlers[eventName].slice(0); // make a copy in case list is modified.

      for (let index = 0; index < handlers.length; index++) {
         handlers[index](error);
      }
   }

   _tokenLoop() {
      if (this._looping) {
         return;
      }

      if (!this._handlers.error &&
         !this._handlers.data &&
         !this._handlers.token) {
         return;
      }

      this._looping = true;

      while (this._looping) {
         const token = this.getNext();

         if (token) {
            if (token instanceof XmlErrorToken) {
               this._notifyHandlersError('data', token);
               this._notifyHandlersError('error', token);
            } else {
               this._notifyHandlersSuccess('data', token);
               this._notifyHandlersSuccess('token', token);
            }
         } else {
            this._looping = false;
         }
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
