/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

//import { WellFormedError } from '../error';
import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';
import {
   entityDeclaration,
   entityEnd,
   entityReference,
   entityStart,
} from '../xToken';

import EntityManager from './EntityManager.js';

/**********************************************************************\
 !!!!
\**********************************************************************/

class NodeStream extends Transform {

   constructor(entityManager, options) {
      super({
         objectMode: true,
      });

      if (!(entityManager instanceof EntityManager)) {
         throw new Error('Must call with an EntityManager instance.');
      }

      this._options = options || {};
      this._entityManager = entityManager;
      this._reference = undefined;
      this._child = undefined;
      this._childCallback = undefined;

      // Protect the 'this' of callbacks.
      this._childData = this._childData.bind(this);
      this._childDone = this._childDone.bind(this);
   }

   _transform(xToken, encoding, callback) {
      if (xToken instanceof entityDeclaration.Token) {
         this._entityManager.addEntityFromInternalSubset(xToken);
      } else if (xToken instanceof entityReference.Token) {
         const declarationSource = this._entityManager.getEntity(xToken.name);

         if (declarationSource) {
            this.push(new entityStart.Token(xToken.name));
            this._reference = xToken;
            const parser = new ParsedStream(declarationSource);
            const tokenizer = new TokenStream();

            this._child = new NodeStream(this._entityManager, this._options);
            this._childCallback = callback;

            xToken = undefined;
            callback = undefined;

            this._child.on('data', this._childData);
            this._child.on('end', this._childDone);
            parser.pipe(tokenizer).pipe(this._child);
         }
      }

      if (xToken) {
         this.push(xToken);
      }

      if (callback) {
         callback();
      }
   }

   _childData(data) {
      this.push(data);
   }

   _childDone() {
      this._child.removeListener('data', this._childData);
      this._child.removeListener('end', this._childDone);
      this._child = undefined;
      const temp = this._childCallback;
      this._childCallback = undefined;
      this.push(new entityEnd.Token(this._reference.name));
      this._reference = undefined;
      temp();
   }
}

export default NodeStream;
