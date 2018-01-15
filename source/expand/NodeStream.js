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
   unassigned,
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
         if (xToken.pToken && xToken.pToken.externalId && xToken.pToken.externalId.unassigned) {
            this._expandUnassigned(xToken.pToken.externalId.unassigned.slice(0), (expandedUnassigned) => {
               xToken.pToken.externalId.unassigned = expandedUnassigned;
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

         if (item.type === entityReference.PARAM_PTYPE && item.name) {
            const itemName = item.name.str;
            const entityToken = this._entityManager.getParameterEntityToken(itemName);

            if (!entityToken || !entityToken.value || !entityToken.value.length === 0) {
               newValue.push(item);
            } else {
               newValue.push(new entityStart.ParamPToken({ refPToken: item }));

               for (let tokenIndex = 0; tokenIndex < entityToken.value.length; tokenIndex++) {
                  newValue.push(entityToken.value[tokenIndex]);
               }

               newValue.push(new entityEnd.ParamPToken({ refPToken: item }));
            }
         } else {
            newValue.push(item);
         }
      }

      entityDeclaration.value = newValue;
      done();
   }

   _expandUnassigned(unassigned, done) {
      const expanded = [];

      let nextValue = unassigned.shift();
      while (nextValue) {
         if (nextValue.type === entityReference.PARAM_PTYPE && nextValue.name && nextValue.name.str) {
            break;
         }

         expanded.push(nextValue);
         nextValue = unassigned.shift();
      }

      if (nextValue) {
         this._expandPERef(nextValue, (expandedPeRef) => {
            this._expandUnassigned(unassigned, (rest) => {
               done(expanded.concat(expandedPeRef, rest));
            });
         });
      } else {
         done(expanded);
      }
   }

   _expandPERef(peRef, deliverExpanded) {
      const entityToken = this._entityManager.getParameterEntityToken(peRef.name.str);

      if (!entityToken || !entityToken.value) {
         deliverExpanded([ peRef ]);
         return;
      }

      this._parseValues(entityToken.value.slice(0), (values) => {
         const allValues = [ new entityStart.ParamPToken({ refPToken: peRef }) ]
            .concat(values, [ new entityEnd.ParamPToken({ refPToken: peRef }) ]);

         deliverExpanded(allValues);
      });
   }

   _parseValues(values, deliverValues) {
      let nextValue = values.shift();
      const newValues = [];

      while (nextValue && nextValue.type !== text.PTYPE) {
         newValues.push(nextValue);
         nextValue = values.shift();
      }

      if (!nextValue) {
         deliverValues(newValues);
         return;
      }

      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText(nextValue.text.originalStr, nextValue.text.ranges[0]); // there will only ever be one
      source.endText();

      // eslint-disable-next-line func-style
      const handler = (item) => {
         if (item) {
            newValues.push(item);
            setTimeout(() => unassigned.parseNextValue(source, handler), 0);  // force async
            return;
         }
         setTimeout(() => {
            this._parseValues(values, (trailingValues) => {
               deliverValues(newValues.concat(trailingValues));
            });
         }, 0);
      };

      unassigned.parseNextValue(source, handler);
   }
}

export default NodeStream;
