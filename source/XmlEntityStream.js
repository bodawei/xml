/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlErrorToken = require('./XmlErrorToken.js');
const XmlStream = require('./XmlStream.js');
const XmlToken = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');

class Context {

   constructor(cursor, stream, startToken) {
      this.cursor = cursor;
      this.stream = stream;
      this.data = [];
      this.start = startToken;
   }

}

function setupHandlers(stream, context, entityStream) {

   function dataHandler(error, data) {
      context.data.push(error || data);

      entityStream._tokenLoop();
   }

   function endHandler() {
      context.ended = true;
      unsubscribe();
   }

   function unsubscribe() {
      stream.off('data', dataHandler);
      stream.off('end', endHandler);
   }

   stream.on('data', dataHandler);
   stream.on('end', endHandler);
}

class XmlEntityStream extends XmlStream {

   // This will inherit the laxness of the tokenStream, unless options is specified
   constructor(tokenStream, entityManager, options) {
      super(options);
      if (!tokenStream || !tokenStream.on) {
         throw Error('The tokenStream must have an on() function.');
      }

      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      const context = new Context(undefined, tokenStream);

      this._contexts = [];
      this._entityManager = entityManager;
      this._contexts.push(context);
      this._options = options || tokenStream._options;

      setupHandlers(tokenStream, context, this);
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
         const token = currentContext.data.shift();

         if (token && token.type === XmlToken.ENTITY_START) {
            const cursor = this._entityManager.getEntity(token.data);

            if (cursor) {
               const stream = new XmlTokenStream(cursor, this._entityManager, {
                  entityType: 'EXTERNAL_ENTITY',
                  lax: this._options.lax
               });
               const context = new Context(cursor, stream, token);
               this._contexts.push(context);
               setupHandlers(stream, context, this);
               token.haveEntityData = true;
            } else {
               const offset = token.chunks[0].statOffset;
               let message = XmlErrorToken.STRING[XmlErrorToken.ERROR.REFERENCE_NO_DECLARATION];

               message = message.replace('{0}', token.data);

               currentContext.data.unshift(new XmlErrorToken(XmlToken.SYNTAX_ERROR,
                  XmlErrorToken.ERROR.REFERENCE_NO_DECLARATION, message, offset, [ offset ]));
            }

         } else if (token && token.type === XmlToken.SYNTAX_ERROR) {
            // add the hierarchical context of the error.
            const contexts = token.context;

            // we don't need to look at index 0, as it will never have a start
            for (let index = this._contexts.length - 1; index > 0; index--) {
               contexts.push(this._contexts[index].start.chunks[0].startOffset);
            }
            token.context = contexts;
         }

         return token;
      } else if (currentContext.ended) {
         this._contexts.pop();
         if (this._contexts.length > 0) {
            return this._innerGetNext();
         } else {
            this._setEnded();
         }
      }
   }

}

module.exports = XmlEntityStream;
