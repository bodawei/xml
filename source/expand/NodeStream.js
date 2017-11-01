/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';
import { LiteralPTokenStream } from '../literalPTokenStream'
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
      if (xToken instanceof entityDeclaration.Token) {
         const func = (xToken instanceof entityDeclaration.ParamToken) ?
            this._entityManager.addParameterEntityFromInternalSubset :
            this._entityManager.addEntityFromInternalSubset;

         if (xToken.value && xToken.value.length > 0) {
            this._populateEntityValue(xToken, () => {
               func.call(this._entityManager, xToken);
               this.push(xToken);
               callback();
            });
            return;
         } else {
            func.call(this._entityManager, xToken);
         }
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

   _populateEntityValue(entityDeclaration, done) {
      let self = this;
      let inProgress = {
         count: 0,
      };

      function finished() {
         inProgress.count --;
         if (inProgress.count === 0) {
            let combined = [];

            for (let index = 0; index < entityDeclaration.value.length; index++) {
               const item = entityDeclaration.value[index];

               if (item instanceof entityReference.ParamToken) {
                  if (inProgress[index]) {
                     combined.push(new entityStart.ParamToken(item.name));
                     combined = combined.concat(self._processArray(inProgress[index].data, index.toString(), inProgress));
                     combined.push(new entityEnd.ParamToken(item.name));
                  }
               } else {
                  combined.push(item);
               }
            }

            entityDeclaration.value = combined;
            done();
         }
      }

      for (let index = 0; index < entityDeclaration.value.length; index++) {
         const item = entityDeclaration.value[index];

         if (item instanceof entityReference.ParamToken) {
            this._addEntityExpansion(item, inProgress, index.toString(), finished);
         }
      }

      if (inProgress.count === 0) {
         done();
      }
   }

   _processArray(anArray, base, workingSet) {
      let combined = [];

      for (let index = 0; index < anArray.length; index++) {
         const item = anArray[index];

         if (item instanceof entityReference.ParamToken) {
            const ctr = `${base}.${index}`;
            if (workingSet[ctr]) {
               combined.push(new entityStart.ParamToken(item.name));
               combined = combined.concat(this._processArray(workingSet[ctr].data, index.toString(), workingSet));
               combined.push(new entityEnd.ParamToken(item.name));
            }
         } else {
            combined.push(item);
         }
      }

      return combined;
   }

   _addEntityExpansion(xToken, workingSet, baseRef, finished) {
      const lTokenStream = this._entityManager.getParameterEntity(xToken.name);

      if (!lTokenStream) {
         return;
      }

      const literalStream = new LiteralPTokenStream(lTokenStream, { peRef: true });
      const xTokenStream = new TokenStream();
      literalStream.pipe(xTokenStream);
      let literalIndex = 0;

      workingSet.count ++;

      workingSet[baseRef] = {
         stream: literalStream,
         data: [],
      };
      xTokenStream.on('end', finished);
      xTokenStream.on('data', (xToken) => {
         literalIndex ++;
         workingSet[baseRef].data.push(xToken);
         if (xToken instanceof entityReference.ParamToken) {
            this._addEntityExpansion(item, workingSet, `${baseRef}.${literalIndex}`);
         }
      });
   }
}

export default NodeStream;
