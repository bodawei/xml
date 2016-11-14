/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const SyntaxError = require('./error/SyntaxError.js');
const XmlStream = require('./XmlStream.js');
const XmlToken = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');

class Context {

   constructor() {
      this.data = [];
      this.ended = false;
   }

   respondToEnd() {
      // by default, a no-op
   }

   setupHandlers(stream, entityStream) {
      const self = this;

      function dataHandler(error, data) {
         self.data.push(error || data);

         entityStream._tokenLoop();
      }

      function endHandler() {
         self.ended = true;
         self.respondToEnd();

         stream.off('data', dataHandler);
         stream.off('end', endHandler);
      }

      stream.on('data', dataHandler);
      stream.on('end', endHandler);
   }

}

class ContentContext extends Context {

   constructor(cursor, stream, startToken) {
      super();

      this.cursor = cursor;
      this.stream = stream;
      this.start = startToken;
   }

}

class ElementContext extends Context {

   constructor(startElementToken, contentContext) {
      super();

      this.token = startElementToken;
      this.attrContexts = [];
      this.contentContext = contentContext;
   }

}

class AttributeContext extends Context {

   constructor(attribute, elementContext, entityStream) {
      super();

      this.attribute = attribute;
      this.value = attribute.value;
      this.index = 0;
      this.elementContext = elementContext;
      this.entityStream = entityStream;
   }

   /*
    * Walk through attribute until we find an entity, then set up
    * potentially async retrieval of that entity. If no entity declaration
    * found, add an error. if no entities wrap up
    */
   expandAttribute() {
      let piece;

      while (!piece && this.index < this.value.length) {
         this.data.push(this.value[this.index]);

         if (this.value[this.index] instanceof XmlToken.EntityStart) {
            piece = this.value[this.index];
         }

         this.index ++;
      }

      if (this.index >= this.value.length) {
         this.ended = true;
         this.finallyDone();
         return;
      }

      const cursor = this.entityStream._entityManager.getEntity(piece.name);

      if (cursor) {
         piece.haveEntityData = true;
         this.cursor = cursor;
         this.stream = new XmlTokenStream(cursor, this.entityStream._entityManager, {
            entityType: 'EXTERNAL_ENTITY',
            lax: this.entityStream._options.lax
         });

         this.setupHandlers(this.stream, this.entityStream);
      } else {
         reportError(SyntaxError.ERROR.REFERENCE_NO_DECLARATION, piece, this.elementContext.contentContext);
         // And continue processing.
         this.expandAttribute();
      }
   }

   respondToEnd() {
      this.expandAttribute();
   }

   finallyDone() {
//      let attrContextStillWorking = false;

      this.cursor = undefined;
      this.stream = undefined;

      this.attribute.value = this.data;

      for (let index = 0; index < this.elementContext.attrContexts.length; index++) {
         //         const attrContext = this.elementContext.attrContexts[index];
         // if (!attrContext.ended) {
         //    attrContextStillWorking = true;
         // }
      }

      // if (!attrContextStillWorking) {
      this.elementContext.ended = true;
      this.entityStream._tokenLoop();
      // }
   }

}

function reportError(id, token, context) {
   const offset = token.chunks ? token.chunks[0].startOffset : undefined;

   context.data.unshift(new SyntaxError(SyntaxError.ERROR.REFERENCE_NO_DECLARATION, [ token.name ],
      offset, [ offset ]));
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

      this._entityManager = entityManager;
      this._contexts = [
         new ContentContext(undefined, tokenStream)
      ];
      this._options = options || tokenStream._options;   // EEW

      this._contexts[0].setupHandlers(tokenStream, this);
   }

   /**********************************************************************\
    getNext() returns the next data (token or error), if any, or returns
    undefined

    RETURN
    XmlToken, SyntaxError or undefined
   \**********************************************************************/

   _innerGetNext() {
      const currentContext = this._contexts[this._contexts.length - 1];

      if (currentContext.data.length > 0) {
         const token = currentContext.data.shift();

         if (token instanceof XmlToken.EntityStart) {
            const cursor = this._entityManager.getEntity(token.name);

            if (cursor) {
               const stream = new XmlTokenStream(cursor, this._entityManager, {
                  entityType: 'EXTERNAL_ENTITY',
                  lax: this._options.lax
               });
               const context = new ContentContext(cursor, stream, token);
               this._contexts.push(context);
               context.setupHandlers(stream, this);
               token.haveEntityData = true;
            } else {
               reportError(SyntaxError.ERROR.REFERENCE_NO_DECLARATION, token, currentContext);
            }
         } else if (token instanceof XmlToken.ElementStart || token instanceof XmlToken.EmptyElement) {
            let elementContext;

            for (let attrIndex = 0; attrIndex < token.attributes.length; attrIndex++) {
               const attribute = token.attributes[attrIndex];
               let startEntityIndex = -1;

               for (let index = 0; index < attribute.value.length; index++) {
                  if (attribute.value[index] instanceof XmlToken.EntityStart) {
                     startEntityIndex = index;
                     break;
                  }
               }

               if (startEntityIndex !== -1) {
                  if (!elementContext) {
                     elementContext = new ElementContext(token, currentContext);
                     this._contexts.push(elementContext);
                  }

                  const attrContext = new AttributeContext(attribute, elementContext, this);
                  elementContext.attrContexts.push(attrContext);
                  attrContext.expandAttribute();
               }
            }

            if (elementContext) {
               return;
            }
         } else if (token instanceof SyntaxError) {
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
         if (currentContext instanceof ElementContext) {
            this._contexts.pop();
            return currentContext.token;
         }

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
