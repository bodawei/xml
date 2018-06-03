/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { defaultExtractors } from '../extractor';
import { PTokenStream } from '../pTokenStream';
import { STokenSource } from '../sToken';
import { PToXTokenStream } from '../xTokenStream';
import {
   attListDeclaration,
   elementDeclaration,
   elementStart,
   entityDeclaration,
   entityEnd,
   entityReference,
   entityStart,
   notationDeclaration,
   text,
   unassigned,
   literalValue,
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
      } else if (xToken instanceof elementDeclaration.XToken) {
         this._processElementDeclaration(xToken, callback);
         return;
      } else if (xToken instanceof notationDeclaration.XToken) {
         this._processNotationDeclaration(xToken, callback);
         return;
      } else if (xToken instanceof attListDeclaration.XToken) {
         this._processAttListDeclaration(xToken, callback);
         return;
      } else if (xToken.type === elementStart.XTYPE || xToken.type === elementStart.EMPTY_XTYPE) {
         this._processElementStart(xToken, callback);
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

   /*
    * Given an unassigned array, pull leading items off until we
    * find an entity reference, and then expand that, and pass
    * the leading items and the expanded value back to the caller.
    */
   _expandThroughNextPERef(unassignedArray, deliverExpanded) {
      if (!unassignedArray) {
         deliverExpanded([]);
         return;
      }

      const expanded = [];

      while (unassignedArray.length > 0) {
         const item = unassignedArray.shift();

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

   /*
    * Convert a PE reference PToken into an array of an
    * entity start, the entity value, and an entity end, or
    * an array containing the PE reference PToken (if it cant be expanded).
    *
    * The entity value consists of text PTokens, as well as other
    * entity start and end's that represent previous PE References that
    * were expanded when the entity was stored.
    *
    * Most callers will do further processing on the entity value.
    *
    * CRUCIALLY, right now this assumes the entity value is delivered
    * synchronously, which is not true i nthe long term.
    */
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

   /**********************************************************************\
    Expand PERefs in unassigned arrays
   \**********************************************************************/

   /*
    * Given an unassigned array, replace any PE reference PTokens with
    * their values, and deliver the expanded unassigned array to the caller.
    */
   _expandPERefsInUnassignedValue(pToken, includeNameListChars, done) {
      const unassignedArray = pToken.unassigned;
      if (!unassignedArray) {
         done();
         return;
      }

      this._expandThroughNextPERef(unassignedArray, (leadingUnassignedValues, expandedPERef) => {
         if (!expandedPERef) {
            pToken.unassigned = leadingUnassignedValues;
            done();
            return;
         }

         const start = expandedPERef.shift();
         const end = expandedPERef.pop() || []; // if this was an unexpandable peref

         this._parsePERefTexts(expandedPERef, includeNameListChars, (values) => {
            pToken.unassigned = leadingUnassignedValues.concat(start, values, end, pToken.unassigned);
            done();
         });
      });
   }

   /*
    * Break down the text values in the pereferences into normal
    * unassigned values.
    */
   _parsePERefTexts(peRefContents, includeNameListChars, deliverValues) {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());

      for (let index = 0; index < peRefContents.length; index++) {
         const item = peRefContents[index];

         if (item.type === text.PTYPE) {
            source.addText(item.text.originalStr, item.text.ranges[0]); // there will only ever be one
         }
      }
      source.endText();

      // setTimeout() candidate
      unassigned.parseAllValues(source, includeNameListChars, deliverValues);
   }

   /**********************************************************************\
    AttList Declaration processing
   \**********************************************************************/

   _processAttListDeclaration(alToken, done) {
      this._expandPERefsInUnassignedValue(alToken.pToken, true, () => {
         if (alToken.pToken.unassigned) {
            attListDeclaration.assignUnassigned(alToken.pToken);
            alToken = attListDeclaration.pTokenToXToken(alToken.pToken);
         }

         this.push(alToken);
         done();
      });
   }

   /**********************************************************************\
    Element Declaration processing
   \**********************************************************************/

   _processElementDeclaration(edXToken, done) {
      this._expandPERefsInUnassignedValue(edXToken.pToken, true, () => {
         if (edXToken.pToken.unassigned) {
            elementDeclaration.assignUnassigned(edXToken.pToken);
            edXToken = elementDeclaration.pTokenToXToken(edXToken.pToken);
         }

         this.push(edXToken);
         done();
      });
   }

   /**********************************************************************\
    Element Start processing
   \**********************************************************************/

   _processElementStart(startXToken, done) {
      if (!startXToken.attributes || startXToken.attributes.length === 0) {
         this.push(startXToken);
         done();
         return;
      }

      let attrsRemaining = startXToken.attributes.length;
      const self = this;

      function attributeDone(newValue, index) {
         attrsRemaining--;
         startXToken.attributes[index].value = newValue;

         if (attrsRemaining === 0) {
            self.push(startXToken);
            done();
         }
      }

      for (let index = 0; index < startXToken.attributes.length; index++) {
         const attr = startXToken.attributes[index];
         this._expandAttributeValue(attr.value, index, attributeDone);
      }
   }

   _expandAttributeValue(attrValue, attrIndex, attrExpanded) {
      if (attrValue.length === 0) {
         attrExpanded(attrValue, attrIndex);
         return;
      }

      let count = 0;
      let doneProcessing = false;
      const expansions = {};
      const self = this;

      function referenceExpanded(refData, refIndex) {
         expansions[refIndex] = refData;
         count--;

         if (count === 0 && doneProcessing) {
            self._buildExpandedAttrValue(attrValue, attrIndex, expansions, attrExpanded);
         }
      }

      for (let index = 0; index < attrValue.length; index++) {
         const item = attrValue[index];

         if (item.type === entityReference.XTYPE) {
            count++;
            this._expandReference(item, index, referenceExpanded);
         }
      }

      doneProcessing = true;
      if (count === 0 && doneProcessing) {
         this._buildExpandedAttrValue(attrValue, attrIndex, expansions, attrExpanded);
      }
   }

   _buildExpandedAttrValue(originalAttrValue, attrIndex, expansions, attrExpanded) {
      let newValue = [];

      for (let index = 0; index < originalAttrValue.length; index++) {
         const item = originalAttrValue[index];

         if (item.type === entityReference.XTYPE) {
            newValue = newValue.concat(expansions[index]);
         } else {
            newValue.push(item);
         }
      }

      attrExpanded(newValue, attrIndex);
   }

   _expandReference(entityRef, indexInAttr, referenceExpanded) {
      const entityInfo = this._entityManager.getEntityInfo(entityRef.name);

      // Well-formedness Constraint: §3.1: No External Entity References
      //    Attribute values must not contain direct or indirect entity
      //    references to external entities.
      if (!entityInfo.isInternal) {
         const sToken = entityRef.pToken ? entityRef.pToken.open : undefined;
         const error = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            [ entityRef.name ], sToken, sToken);
         this.push(error);
      }

      const sTokenStream = entityInfo.getStream();

      literalValue.parse(sTokenStream, [ '&' ], (pTokenResult) => {
         const xToken = literalValue.makeXTokenCompatible(pTokenResult);

         this._expandAttributeValue(xToken, -1, (subXToken) => {
            subXToken.unshift(new entityStart.XToken(entityRef.name));
            subXToken.push(new entityEnd.XToken(entityRef.name));
            referenceExpanded(subXToken, indexInAttr);
         });
      });
   }

   /**********************************************************************\
    Entity Declaration processing
   \**********************************************************************/

   _processEntityDeclaration(edToken, callback) {
      this._expandPERefsInUnassignedValue(edToken.pToken, false, () => {
         if (edToken.pToken.unassigned) {
            entityDeclaration.assignUnassigned(edToken.pToken);
            edToken = entityDeclaration.pTokenToXToken(edToken.pToken);
         }

         this._expandPeRefsInEntityValue(edToken.value, (newValue) => {
            edToken.value = newValue;
            this._addEntityDeclaration(edToken, callback);
         });
      });
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

   /**********************************************************************\
    Notation Declaration processing
   \**********************************************************************/

   _processNotationDeclaration(ndToken, callback) {
      this._expandPERefsInUnassignedValue(ndToken.pToken, false, () => {
         if (ndToken.pToken.unassigned) {
            if (ndToken.pToken.externalId) {
               ndToken.pToken.externalId.unassigned = ndToken.pToken.unassigned;
            }
            notationDeclaration.assignUnassigned(ndToken.pToken);
            ndToken = notationDeclaration.pTokenToXToken(ndToken.pToken);
         }
         this.push(ndToken);
         callback();
      });
   }

}

export default NodeStream;
