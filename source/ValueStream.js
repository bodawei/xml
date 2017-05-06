/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const stream = require('readable-stream');

const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');
const XmlReference = require('./XmlReference.js');
const XmlText = require('./XmlText.js');
const XmlTokenStreamMisc = require('./XmlTokenStream-misc.js');
const XmlWarning = require('./error/XmlWarning.js');

const TERMINATORS = [ '&', '%' ];

/**********************************************************************\
 A ValueStream is used, internally, by an EntityExpandingStream. It is
 used to convert the contents of a cursor into a series of tokens
 appropriate for use in an attribute value, or an entity value.

 Options:
   - geRef: true|false: Recognize general Entity References
   - peRef: true|false: Recognize parameter Entity References
   - attributeName: string|undefined: this is for an attribute
      (look for <'s)
 In addition to those, this will always recognize a character
 reference.
\**********************************************************************/

class ValueStream extends stream.Readable {

   constructor(cursor, options = {}) {
      super({
         objectMode: true
      });

      if (!cursor) {
         throw Error('Must provide a cursor instance to ValueStream().');
      }

      this._cursor = cursor;
      this._options = {
         geRef: options.geRef || false,
         peRef: options.peRef || false,
         attributeName: options.attributeName || ''
      };
      this._pendingChunks = [];
   }

   _read() {
      this._pushedValue = false;

      while (!this._pushedValue) {
         const result = XmlTokenStreamMisc.parseUnknownInValue(this._cursor);

         if (!result.hasMore) {
            this._pushToken(null);
            return;
         }

         if (result.refStart) {
            if (result.refStart.text === '&') {
               this._getReference(result.refStart);
            } else { // Necessarily a % since that's all the parser will return.
               this._getParameterEntityReference(result.refStart);
            }

            if (this._pushedValue === false) {
               this._pendingChunks.push(result.refStart);
            }
         }

         this._getText();
      }
   }

   _getReference(start) {
      const nextChar = this._cursor.peekChar();

      if (nextChar && nextChar.text === '#') {
         const reference = XmlTokenStreamMisc.parseReference(this._cursor, start);

         XmlReference.validateCharReference(reference, this);

         this._pushToken(new tokens.CharRef(reference.character, this._cursor.getRecentChunks()));
      } else if (this._options.geRef) {
         const reference = XmlTokenStreamMisc.parseReference(this._cursor, start);
         const name = reference.nameChunk ? reference.nameChunk.text : '';

         XmlReference.validateEntityReference(reference, this);

         this._pushToken(new tokens.EntityReference(name, this._cursor.getRecentChunks()));
      }
   }

   _getParameterEntityReference(start) {
      if (this._options.peRef) {
         const reference = XmlTokenStreamMisc.parseReference(this._cursor, start);
         const name = reference.nameChunk ? reference.nameChunk.text : '';

         XmlReference.validateEntityReference(reference, this);

         this._pushToken(new tokens.ParameterEntityReference(name, this._cursor.getRecentChunks()));
      }
   }

   _getText() {
      const info = this._cursor.getToTerminator(TERMINATORS);

      if (info.chunk) {
         XmlText.validateText(info.chunk, this._cursor.entityMd, info.chunk, this);

         if (this._options.attributeName) {
            this._checkSyntax(info.chunk.text.indexOf('<') === 0,
               SyntaxError.ID.ATTRIBUTE_INVALID_VALUE, this._options.attributeName, info.chunk);
         }

         this._pendingChunks.push(info.chunk);

         // flush any recent chunks, we do not care about them, as we are managing them
         this._cursor.getRecentChunks();
      }
   }

   _pushToken(newToken) {
      if (this._pendingChunks.length > 0) {
         const combinedChunk = XmlTokenStreamMisc.combineChunks(...this._pendingChunks);
         this._pendingChunks = [];
         this.push(new tokens.Text(combinedChunk.text, [ combinedChunk ]));
      }

      this.push(newToken);
      this._pushedValue = true;
   }

   _report(code, params, place, context) {
      this._pushToken(new SyntaxError(code, params, place, context, this._cursor.entityMd.location));
   }

   _checkSyntax(condition, code, params, place, context) {
      if (!condition) {
         this._report(code, params, place, context);
      }
   }

   _warn(code, params, place, context) {
      this._pushToken(new XmlWarning(code, params, place, context, this._cursor.entityMd.location));
   }

}

module.exports = ValueStream;
