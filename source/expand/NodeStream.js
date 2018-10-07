/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import { Transform } from 'readable-stream';

import { EntityMetaData } from '../basic';
import { XmlWarning, ValidityError, WellFormedError } from '../error';
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
         } else {
            const startToken = xToken.pToken && xToken.pToken.open;
            const error = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION,
               [ xToken.name ], startToken, startToken);
            this.push(error);
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
   _expandThroughNextPERef(unassignedArray /* always defined */, deliverExpanded) {
      const expanded = [];

      while (unassignedArray.length > 0) {
         const item = unassignedArray.shift();

         if (item.type === 'reference') {
            this._expandPERefFully(item.token, (expandedItem) => {
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
    * Same as above, but for entity values @@@@
    */
   _expandThroughNextPERefInEntityValue(entityValueArray, deliverExpanded) {
      if (!entityValueArray) {
         deliverExpanded([]);
         return;
      }

      const expanded = [];

      while (entityValueArray.length > 0) {
         const item = entityValueArray.shift();

         if (item.type === entityReference.PARAM_PTYPE) {
            this._expandPERefFullyInEntityValue(item, (expandedItem) => {   // This is going to be a problem
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
    * synchronously, which is not true in the long term.
    */
   _expandPERefFully(peRef, deliverExpanded) {
      const itemName = peRef.name && peRef.name.str || '';
      const entityToken = this._entityManager.getParameterEntityToken(itemName);

      if (!entityToken || !entityToken.value) {
         deliverExpanded([ {
            type: 'reference',
            token: peRef,
         } ]);
      } else {
         const expanded = [ {
            type: 'entityStart',
            token: new entityStart.ParamPToken({ refPToken: peRef }),
         } ].concat(entityToken.value, {
            type: 'entityEnd',
            token: new entityEnd.ParamPToken({ refPToken: peRef }),
         });

         deliverExpanded(expanded);
      }
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
   _expandPERefFullyInEntityValue(peRef, deliverExpanded) {
      const itemName = peRef.name && peRef.name.str || '';
      const entityToken = this._entityManager.getParameterEntityToken(itemName);

      if (!entityToken || !entityToken.value) {
         deliverExpanded([ peRef ]);
      } else {
         const expanded = [ new entityStart.ParamPToken({ refPToken: peRef }) ]
            .concat(entityToken.value, new entityEnd.ParamPToken({ refPToken: peRef }));

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
      if (!pToken || !pToken.unassigned) {
         done();
         return;
      }
      const unassignedArray = pToken.unassigned;

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
         const open = alToken.pToken && alToken.pToken.open;

         if (alToken.pToken.unassigned) {
            attListDeclaration.assignUnassigned(alToken.pToken);
            alToken = attListDeclaration.pTokenToXToken(alToken.pToken);
         }

         this._expandAttributeValues(alToken.attDefs, open, () => {
            this.push(alToken);
            done();
         });
      });
   }

   /**********************************************************************\
    Element Declaration processing
   \**********************************************************************/

   _processElementDeclaration(edXToken, done) {
      this._expandPERefsInUnassignedValue(edXToken.pToken, true, () => {
         if (edXToken.pToken && edXToken.pToken.unassigned) {
            this._examineUnassigned(edXToken);

            elementDeclaration.assignUnassigned(edXToken.pToken);
            edXToken = elementDeclaration.pTokenToXToken(edXToken.pToken);
         }

         this.push(edXToken);
         done();
      });
   }

   /*
    * Examine the unassigned values, and address these concerns from
    * §3.2.1:
    *    Parameter-entity replacement text must be properly nested with
    *    parenthetized groups. That is to say, if either of the opening
    *    or closing parentheses in a choice, seq, or Mixed construct is
    *    contained in the replacement text for a parameter entity, both
    *    must be contained in the same replacement text.
    *
    *    For interoperability, if a parameter-entity reference appears in
    *    a choice, seq, or Mixed construct, its replacement text should
    *    not be empty, and neither the first nor last non-blank character
    *    of the replacement text should be a connector (| or ,).
    *
    * In practice, that means this general algorithm: Examine the expanded
    * unassigned values before they are assigned (when we still have access
    * to the record of which entities were expanded).
    *
    * None of this can happen until we are actually within the contentSpec,
    * which may have already been started, or not. Thereafter, keep track of
    * the balance of parentheses and balance of entities. Once we have
    * finished traversing a topmost entity expansion, check if the parentheses
    * are unbalanced (if so, we have a validity constrant). Also check if
    * we've seen any relevant text in the expanded entity, and whether
    * the last "word" we saw was a connector.
    *
    * Report these conditions, reset and then continue, as this may happen
    * multiple times in one set of unassigned values. Note that we allow for
    * parentheses to be balanced across entities. A validation error will be
    * reported, but it will still ultimately be assigned, later, correctly.
    */
   _examineUnassigned(edXToken) {
      const pToken = edXToken.pToken;
      const unassignedArray = pToken.unassigned;
      let insideContentSpec = !!pToken.children;
      let entityDepth = 0;
      let parenDepth = 0;
      let sawNonWhite = false;
      let endedWithConnector = false;
      let topEntityRef;

      if (pToken.children && pToken.children.close) {
         return;
      }

      for (const entry of unassignedArray) {
         switch (entry.type) {
            case 'entityStart':
               entityDepth++;
               if (entityDepth === 1) {
                  topEntityRef = entry.token.refPToken;
               }
               break;
            case 'entityEnd':
               entityDepth--;
               break;
            case 'word':
               const content = entry.token.text && entry.token.text.str;
               if (content === '(') {
                  insideContentSpec = insideContentSpec && entityDepth > 0;
                  parenDepth++;
               } else if (content === ')') {
                  parenDepth--;
               }

               endedWithConnector = (content === '|' || content === ',');
               sawNonWhite = true;
               break;
            case 'literal':
               sawNonWhite = true;
               endedWithConnector = false;
               break;
         }

         if (insideContentSpec && entityDepth === 0 && topEntityRef) {
            if (parenDepth !== 0) {
               const error = new ValidityError(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
                  [ pToken.name.str, topEntityRef.name.str ], topEntityRef.open, pToken.open);
               this.push(error);
            }

            if (endedWithConnector) {
               const warning = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
                  [ pToken.name.str, topEntityRef.name.str ], topEntityRef.open, pToken.open);
               this.push(warning);
            }

            if (!sawNonWhite) {
               const warning = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
                  [ pToken.name.str, topEntityRef.name.str ], topEntityRef.open, pToken.open);
               this.push(warning);
            }

            sawNonWhite = false;
            endedWithConnector = false;
            topEntityRef = undefined;
         }
      }
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

      const openSToken = startXToken.pToken && startXToken.pToken.open;

      this._expandAttributeValues(startXToken.attributes, openSToken, () => {
         this.push(startXToken);
         done();
      });
   }

   _expandAttributeValues(attributeArray, openSToken, done) {
      let attrsRemaining = attributeArray.length;
      const self = this;

      if (attrsRemaining === 0) {
         done();
         return;
      }

      for (const attr of attributeArray) {
         // eslint-disable-next-line no-loop-func
         this._expandAttributeValue(attr.value, (newValue) => {
            self._scanValueForBadText(attr.name, newValue, openSToken);
            attr.value = newValue;
            attrsRemaining--;

            if (attrsRemaining === 0) {
               done();
            }
         });
      }
   }

   _expandAttributeValue(attrValue, attrExpanded) {
      if (attrValue.length === 0) {
         attrExpanded(attrValue);
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
            self._buildExpandedAttrValue(attrValue, expansions, attrExpanded);
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
         this._buildExpandedAttrValue(attrValue, expansions, attrExpanded);
      }
   }

   _buildExpandedAttrValue(originalAttrValue, expansions, attrExpanded) {
      let newValue = [];

      for (let index = 0; index < originalAttrValue.length; index++) {
         const item = originalAttrValue[index];

         if (item.type === entityReference.XTYPE) {
            newValue = newValue.concat(expansions[index]);
         } else {
            newValue.push(item);
         }
      }

      attrExpanded(newValue);
   }

   _scanValueForBadText(name, value, sToken) {
      let entityDepth = 0;

      // Well-formedness constraint: §3.1: No < in Attribute Values
      //   The replacement text of any entity referred to directly or indirectly
      //   in an attribute value must not contain a <.
      for (const valuePart of value) {
         if (valuePart.type === entityStart.XTYPE) {
            entityDepth++;
         } else if (valuePart.type === entityEnd.XTYPE) {
            entityDepth--;
         } else if (valuePart.type === text.XTYPE && entityDepth > 0) {
            // Don't report on things at depth 0 because attribute.checkWellFormed() already did.
            if (valuePart.text && valuePart.text.indexOf('<') !== -1) {
               const error = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
                  [ name ], sToken, sToken);
               this.push(error);
            }
         }
      }
   }

   _expandReference(entityRef, indexInAttr, referenceExpanded) {
      const entityInfo = this._entityManager.getEntityInfo(entityRef.name);
      // Note.  Pass a bad reference in, and this will barf

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

         this._expandAttributeValue(xToken, (subXToken) => {
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
      this._expandThroughNextPERefInEntityValue(entityValue, (before, expandedPERef) => {
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
