/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const stream = require('readable-stream');

const tokens = require('./XmlToken.js');
const XmlTokenStreamMisc = require('./XmlTokenStream-misc.js');

const TERMINATORS = [ '&', '%' ];

/**********************************************************************\
 A ValueStream is used, internally, by an EntityExpandingStream. It is
 used to convert the contents of a cursor into a series of tokens
 appropriate for use in an attribute value, or an entity value.

 The options are used to specify what should be recognized:
   - General Entity References
   - Parameter Entity References
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
         peRef: options.peRef || false
      };
      this._miscParser = new XmlTokenStreamMisc();
      this._pendingChunks = [];
   }

   _read() {
      this._pushedValue = false;

      while (!this._pushedValue) {
         const result = this._miscParser.parseUnknownInValue(this._cursor);

         if (!result.type) {
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
         const reference = this._miscParser.parseReference(this._cursor, start);

         this._pushToken(new tokens.CharRef(reference.character, this._cursor.getRecentChunks()));
      } else if (this._options.geRef) {
         const reference = this._miscParser.parseReference(this._cursor, start);
         const name = reference.nameChunk ? reference.nameChunk.text : '';

         this._pushToken(new tokens.EntityReference(name, this._cursor.getRecentChunks()));
      }
   }

   _getParameterEntityReference(start) {
      if (this._options.peRef) {
         const reference = this._miscParser.parseReference(this._cursor, start);
         const name = reference.nameChunk ? reference.nameChunk.text : '';

         this._pushToken(new tokens.ParameterEntityReference(name, this._cursor.getRecentChunks()));
      }
   }

   _getText() {
      const info = this._cursor.getToTerminator(TERMINATORS);

      if (info.chunk) {
         this._pendingChunks.push(info.chunk);
         // flush any recent chunks, we do not care about them, as we are managing them
         this._cursor.getRecentChunks();
      }
   }

   _pushToken(newToken) {
      if (this._pendingChunks.length > 0) {
         const combinedChunk = this._miscParser.combineChunks(...this._pendingChunks);
         this._pendingChunks = [];
         this.push(new tokens.Text(combinedChunk.text, [ combinedChunk ]));
      }

      this.push(newToken);
      this._pushedValue = true;
   }
}

module.exports = ValueStream;
