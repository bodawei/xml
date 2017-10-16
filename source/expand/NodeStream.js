/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

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
      this._child = undefined;

      this._child = undefined;
      this._childCallback = undefined;

      // Protect the 'this' of callbacks.
      this._childData = this._childData.bind(this);
      this._childDone = this._childDone.bind(this);
   }

   _transform(xToken, encoding, callback) {
      if (xToken instanceof entityDeclaration.ParamToken) {
         this._entityManager.addParameterEntityFromInternalSubset(xToken);
      } else if (xToken instanceof entityDeclaration.Token) {
         this._entityManager.addEntityFromInternalSubset(xToken);
      } else if (xToken instanceof entityReference.Token) {
         const isPeRef = (xToken instanceof entityReference.ParamToken);
         const getter = isPeRef ? this._entityManager.getParameterEntity : this._entityManager.getEntity;
         const declarationSource = getter.call(this._entityManager, xToken.name);

         if (declarationSource) {
            const tokenType = isPeRef ? entityStart.ParamToken : entityStart.Token;
            this.push(new tokenType(xToken.name));
            const parser = new ParsedStream(declarationSource);
            const tokenizer = new TokenStream();

            this._child = {
               xToken,
               callback,
               stream: new NodeStream(this._entityManager, this._options),
            };

            this._child.stream.on('data', this._childData);
            this._child.stream.on('end', this._childDone);
            parser.pipe(tokenizer).pipe(this._child.stream);

            return;
         }
      }

      this.push(xToken);
      callback();
   }

   _childData(data) {
      this.push(data);
   }

   _childDone() {
      const isPeRef = (this._child.xToken instanceof entityReference.ParamToken);
      const tokenType = isPeRef ? entityEnd.ParamToken : entityEnd.Token;

      this._child.stream.removeListener('data', this._childData);
      this._child.stream.removeListener('end', this._childDone);

      this.push(new tokenType(this._child.xToken.name));

      const temp = this._child.callback;
      delete this._child;
      temp();
   }
}

export default NodeStream;
