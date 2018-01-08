/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

import { EntityMetaData } from '../basic';
import { defaultExtractors } from '../extractor';
import { PTokenStream } from '../pTokenStream';
import { STokenSource } from '../sToken';
import { PToXTokenStream } from '../xTokenStream';
import {
   entityDeclaration,
   entityEnd,
   entityReference,
   entityStart,
   notationDeclaration,
   text,
   usp,
} from '../token';

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
      if (xToken instanceof entityDeclaration.XToken) {
         const func = (xToken instanceof entityDeclaration.ParamXToken) ?
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
      } else if (xToken instanceof entityReference.XToken) {
         const isPeRef = (xToken instanceof entityReference.ParamXToken);
         const getter = isPeRef ? this._entityManager.getParameterEntity : this._entityManager.getEntity;
         const declarationSource = getter.call(this._entityManager, xToken.name);

         if (declarationSource) {
            const tokenType = isPeRef ? entityStart.ParamXToken : entityStart.XToken;
            this.push(new tokenType(xToken.name));
            const pTokenStream = new PTokenStream(declarationSource);
            const tokenizer = new PToXTokenStream();

            this._child = {
               xToken,
               callback,
               stream: new NodeStream(this._entityManager, this._options),
            };

            this._child.stream.on('data', this._childData);
            this._child.stream.on('end', this._childDone);
            pTokenStream.pipe(tokenizer).pipe(this._child.stream);

            return;
         }
      } else if (xToken instanceof notationDeclaration.XToken) {
         if (xToken.pToken && xToken.pToken.externalId && xToken.pToken.externalId.incomplete) {
            this._processIncomplete(xToken, xToken.pToken.externalId, () => {
               this.push(xToken);
               callback();
            });
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
      const isPeRef = (this._child.xToken instanceof entityReference.ParamXToken);
      const tokenType = isPeRef ? entityEnd.ParamXToken : entityEnd.XToken;

      this._child.stream.removeListener('data', this._childData);
      this._child.stream.removeListener('end', this._childDone);

      this.push(new tokenType(this._child.xToken.name));

      const temp = this._child.callback;
      delete this._child;
      temp();
   }

   _populateEntityValue(entityDeclaration, done) {
      const newValue = [];

      for (let index = 0; index < entityDeclaration.value.length; index++) {
         const item = entityDeclaration.value[index];

         if (item.type === entityReference.PARAM_PTYPE) {
            const itemName = item.name ? item.name.str : '';
            const entityToken = this._entityManager.getParameterEntityToken(itemName);

            if (!entityToken || !entityToken.value || !entityToken.value.length === 0) {
               newValue.push(item);
            } else {
               newValue.push(new entityStart.ParamXToken(itemName)); // should a PToken like thing

               for (let tokenIndex = 0; tokenIndex < entityToken.value.length; tokenIndex++) {
                  newValue.push(entityToken.value[tokenIndex]);
               }

               newValue.push(new entityEnd.ParamXToken(itemName));
            }
         } else {
            newValue.push(item);
         }
      }

      entityDeclaration.value = newValue;
      done();
   }

   _processIncomplete(xToken, incompleteParent, done) {
      this._processNext(incompleteParent, 0, (expandedIncomplete) => {
         incompleteParent.incomplete = expandedIncomplete;
         done();
      });
   }

   _processNext(incompleteParent, index, done) {
      if (index >= incompleteParent.incomplete.length) {
         done([]);
         return;
      }

      const item = incompleteParent.incomplete[index];

      this._expandPERef(item, (replacement) => {
         this._processNext(incompleteParent, index + 1, (result) => {
            done(replacement.concat(result));
         });
      });
   }

   _expandPERef(peRef, deliverExpanded) {
      if (peRef.type !== entityReference.PARAM_PTYPE) {
         deliverExpanded([ peRef ]);
         return;
      }

      const results = [];
      const entityToken = this._entityManager.getParameterEntityToken(peRef.name.str || '');

      if (!entityToken || !entityToken.value) {
         results.push(peRef);
         deliverExpanded(results);
      } else {
         results.push({
            type: 'pestart',
            item: peRef,
         });

         this._insertEntityPiece(entityToken, 0, peRef, results, deliverExpanded);
      }
   }

   _insertEntityPiece(entityToken, index, peRef, results, deliverResults) {
      if (entityToken.value.length === index) {
         results.push({
            type: 'peend',
            item: peRef,
         });
         deliverResults(results);
         return;
      }

      const tokenItem = entityToken.value[index];

      if (tokenItem.type === text.PTYPE) {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(tokenItem.text.originalStr); // add the range
         source.endText();
         usp.parse(source, {}, (parsed) => {
            results = results.concat(parsed);
            this._insertEntityPiece(entityToken, index + 1, peRef, results, deliverResults);
         });
      } else {
         this._expandPERef(tokenItem, (result) => {
            results = results.concat(result);
            this._insertEntityPiece(entityToken, index + 1, peRef, results, deliverResults);
         });
      }
   }
}

export default NodeStream;
