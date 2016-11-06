/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlErrorToken = require('./XmlErrorToken.js');

const EVENT_NAMES = [ 'data', 'end', 'error', 'token' ];

/**********************************************************************\
 XmlStream is a generic superclass providing eventing and token/error
 delivery to all subclasses.

 Subclasses MUST define _innerGetNext().
 _innerGetNext() must call _setEnded() when the end of data is found.
 However, this class may also call _setEnded() if, for example, the
 this is in strict mode and an error is encountered.  'end' will always
 be delivered after the error token was delivered, though the caller
 may need to call getNext first.
 Subtype's hasNext() should also consult _noNext in case this needs to
 override it's behavior.    (ick)
\**********************************************************************/

class XmlStream {

   constructor(options) {
      this._handlers = {};
      this._options = {
         lax: false
      };

      if (options) {
         this._options.lax = options.lax;
      }
   }

   getNext() {
      if (this._ended) {
         return;
      }
      if (this._errored) {
         this._setEnded();
         return;
      }

      const token = this._innerGetNext();

      if (token instanceof XmlErrorToken && !this._options.lax) {
         const e = new Error(token.message);
         e.details = token;
         this._errored = true;
         this._noNext = true;
         throw e;
      }

      return token;
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

   _notifyHandlers(eventName, error, data) {
      if (!this._handlers[eventName]) {
         return;
      }

      const handlers = this._handlers[eventName].slice(0); // make a copy in case list is modified.

      for (let index = 0; index < handlers.length; index++) {
         handlers[index](error, data);
      }
   }

   _setEnded() {
      if (!this._ended) {
         this._notifyHandlers('end');
      }

      this._ended = true;
   }

   _tokenLoop() {
      if (this._looping || this._ended) {
         return;
      }
      if (!this._handlers.error &&
         !this._handlers.data &&
         !this._handlers.token) {
         return;
      }

      this._looping = true;

      while (this._looping) {
         if (this._errored) {
            this._setEnded();
            this._looping = false;
            return;
         }

         const token = this._innerGetNext();

         if (token) {
            if (token instanceof XmlErrorToken) {
               this._notifyHandlers('data', token);
               this._notifyHandlers('error', token);

               // arbort and notify if we are in strict mode
               if (!this._options.lax) {
                  this._setEnded();
                  this._looping = false;
               }
            } else {
               this._notifyHandlers('data', undefined, token);
               this._notifyHandlers('token', undefined, token);
            }

            /*
             * The handlers may be removed by the notification process. We don't want
             * to pull off another token and then have no where to deliver it to!
             * Subtle potential bug!
             */
            if (!this._handlers.error &&
               !this._handlers.data &&
               !this._handlers.token) {
               this._looping = false;
            }
         } else {
            this._looping = false;
         }
      }
   }

}

module.exports = XmlStream;
