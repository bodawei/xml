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
         this._processEntityDeclaration(xToken, callback);
         return;
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
         this._processNotationDeclaration(xToken, callback);
         return;
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

   /**********************************************************************\
    Expand PERefs
   \**********************************************************************/

   // Given a PERef PToken, return an array Text, EntityStart,
   // EntityEnd and PERef (for unexpandable oens) PTokens.
   // Most consumers will then do further processing of the Text bits
   _expandPERefFully(peRef, deliverExpanded) {
      const itemName = peRef.name && peRef.name.str || '';
      const entityToken = this._entityManager.getParameterEntityToken(itemName);

      if (!entityToken || !entityToken.value) {
         deliverExpanded([ peRef ]);
      } else {
         const expanded = [
            new entityStart.ParamPToken({ refPToken: peRef }),
         ].concat(entityToken.value, new entityEnd.ParamPToken({ refPToken: peRef }));

         deliverExpanded(expanded);
      }
   }

   _expandThroughNextPERef(mixedArray, deliverExpanded) {
      if (!mixedArray) {
         deliverExpanded([]);
         return;
      }

      const expanded = [];

      while (mixedArray.length > 0) {
         const item = mixedArray.shift();

         if (item.type === entityReference.PARAM_PTYPE) {
            this._expandPERefFully(item, (expandedItem) => {
               deliverExpanded(expanded, expandedItem);
            });
            return;
         } else {
            expanded.push(item);
         }
      }

      deliverExpanded(expanded);
   }

   /**********************************************************************\
    Expand PERefs in unassigned arrays
   \**********************************************************************/

   _expandPERefsInUnassignedValue(unassignedValues, deliverExpanded) {
      this._expandThroughNextPERef(unassignedValues, (before, expandedPERef) => {
         if (!expandedPERef) {
            deliverExpanded(before);
            return;
         }

         const start = expandedPERef.shift();
         const end = expandedPERef.pop() || []; // if this was an unexpandable peref

         this._parsePERefTexts(expandedPERef, (values) => {
            deliverExpanded(before.concat(start, values, end));
         });
      });
   }

   _parsePERefTexts(peRefContents, deliverValues) {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());

      for (let index = 0; index < peRefContents.length; index++) {
         const item = peRefContents[index];

         if (item.type === text.PTYPE) {
            source.addText(item.text.originalStr, item.text.ranges[0]); // there will only ever be one
         }
      }
      source.endText();

      // setTimeout() candidate
      unassigned.parseAllValues(source, deliverValues);
   }

   /**********************************************************************\
    Notation Declaration processing
   \**********************************************************************/

   _processNotationDeclaration(ndToken, callback) {
      if (ndToken.pToken && ndToken.pToken.unassigned) {
         this._expandPERefsInUnassignedValue(ndToken.pToken.unassigned, (expandedUnassigned) => {
            ndToken.pToken.unassigned = expandedUnassigned;
            if (ndToken.pToken.externalId) {
               ndToken.pToken.externalId.unassigned = expandedUnassigned;
            }

            notationDeclaration.assignUnassigned(ndToken.pToken);

            const newNDToken = notationDeclaration.pTokenToXToken(ndToken.pToken);
            this.push(newNDToken);
            callback();
         });
      } else {
         this.push(ndToken);
         callback();
      }
   }

   /**********************************************************************\
    EntityDeclaration processing
   \**********************************************************************/

   _processEntityDeclaration(edToken, callback) {
      if (edToken.pToken && edToken.pToken.unassigned) {
         this._expandPERefsInUnassignedValue(edToken.pToken.unassigned, (parsed) => {
            edToken.pToken.unassigned = parsed;
            entityDeclaration.assignUnassigned(edToken.pToken);
            const newXToken = entityDeclaration.pTokenToXToken(edToken.pToken);
            this._expandPeRefsInEntityValue(newXToken.value, (newValue) => {
               newXToken.value = newValue;
               this._addEntityDeclaration(newXToken, callback);
            });
         });
      } else {
         this._expandPeRefsInEntityValue(edToken.value, (newValue) => {
            edToken.value = newValue;
            this._addEntityDeclaration(edToken, callback);
         });
      }
   }

   _expandPeRefsInEntityValue(entityValue, deliverExpanded) {
      this._expandThroughNextPERef(entityValue, (before, expandedPERef) => {
         if (!expandedPERef) {
            deliverExpanded(before);
            return;
         }

         this._expandPeRefsInEntityValue(entityValue, (rest) => {
            deliverExpanded(before.concat(expandedPERef, rest));
         });
      });
   }

   _addEntityDeclaration(edToken, callback) {
      if (edToken instanceof entityDeclaration.ParamXToken) {
         this._entityManager.addParameterEntityFromInternalSubset(edToken);
      } else {
         this._entityManager.addEntityFromInternalSubset(edToken);
      }

      this.push(edToken);
      callback();
   }

}

export default NodeStream;
