/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from 'basic';
import { ErrorCollector, XmlWarning, ValidityError, WellFormedError } from 'error';
import { defaultExtractors } from '../extractor';
import { PTokenStream } from '../pTokenStream';
import { SToken, STokenSource } from 'sToken';
import { PToXTokenStream } from '../xTokenStream';
import {
   attListDeclaration,
   docTypeStart,
   docTypeEnd,
   elementDeclaration,
   elementStart,
   entityDeclaration,
   GENERAL_ENTITY_END_XTOKEN,
   GENERAL_ENTITY_START_XTOKEN,
   ParameterEntityEndPToken,
   notationDeclaration,
   text,
   unassigned,
   literalValue,

   ExternalSubsetEndXToken,
   ExternalSubsetStartXToken,
   InternalSubsetEndXToken,
   InternalSubsetStartXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartPToken,
   ParameterEntityStartXToken,
   XMLDECL_XTOKEN,
   XmlDeclarationXToken,
   GeneralEntityReferencePToken,
   GeneralEntityReferenceXToken,
   ParameterEntityReferenceXToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ParameterEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_XTOKEN,
} from '../token';
import { AttributeValueXToken } from '../token/common/attribute'; // badRef
import { AttListXToken } from '../token/attListDeclaration'; // badRef
import { ElementDeclaration } from '../token/elementDeclaration'; // badRef
import { ElementStart, ElementEmpty } from '../token/elementStart'; // badRef
import { GeneralEntityDeclarationXToken, ParameterEntityDeclarationPToken, ParameterEntityDeclarationXToken, PARAMETER_ENTITY_DECLARATION_XTOKEN } from '../token/entityDeclaration'; // badRef
import { NotationDeclaration } from '../token/notationDeclaration'; // badRef
import { TextPToken, TextXToken } from '../token/text'; // badRef
import { checkXmlLangWellFormed } from '../token/common/langAttribute';

import EntityManager from './EntityManager';
import { UnassignedArray, UnassignedType } from '../token/common/unassigned';
import { LiteralValueXToken } from '../token/common/literal';
import { DocTypeStartXToken } from 'source/token/docTypeStart';
import { CharRefXToken } from 'source/token/charRef';

type XToken = { type: string };
type PToken = {
   type: string,
   unassigned?: UnassignedArray,
};
type DoneSignal = () => void;
type EntityValueArray = Array<TextPToken|GeneralEntityReferencePToken|ParameterEntityReferencePToken|ParameterEntityEndPToken|ParameterEntityStartPToken>; // same as literalValue, but with start and end
type CommonAttributeXToken = {
   name: string,
   value: AttributeValueXToken,
};
type ExpandedLiteralValueXToken = Array<TextXToken|CharRefXToken|GeneralEntityReferenceXToken|ParameterEntityReferenceXToken|GeneralEntityStartXToken|GeneralEntityEndXToken|ParameterEntityStartXToken|ParameterEntityEndXToken>;
type ExpansionsMap = { [key: number]: LiteralValueXToken|GeneralEntityReferenceXToken };

enum ProcessMode {
   VALIDATE,
   NON_VALIDATING,
   STANDALONE,
};

type ExpandOptions = {
   validating?: boolean,
}

/**********************************************************************\
 !!!!
\**********************************************************************/

class NodeStream extends stream.Transform {
   private _entityManager: EntityManager;
   private _options: {};
   private _child: any;
   private docTypeStart?: DocTypeStartXToken;
   private processMode: ProcessMode;
   private skipDeclarations: boolean = false; // §5.1

   constructor(entityManager: EntityManager, options: ExpandOptions = {}) {
      super({
         objectMode: true,
      });

      this._options = options;
      this._entityManager = entityManager;
      this._child = undefined;

      this._child = undefined;
      this.processMode = options.validating === false ? ProcessMode.NON_VALIDATING : ProcessMode.VALIDATE;

      // Protect the 'this' of callbacks.
      this._childData = this._childData.bind(this);
      this._childDone = this._childDone.bind(this);
   }

   _transform(xToken: XToken, encoding: string, callback: () => void) {
      // May want to give an error if emd is not document, and non-validating

      if (xToken instanceof GeneralEntityReferenceXToken || xToken instanceof ParameterEntityReferenceXToken) {
         const isPeRef = (xToken instanceof ParameterEntityReferenceXToken);
         const getter = isPeRef ? this._entityManager.getParameterEntity : this._entityManager.getEntity;
         const declarationSource = getter.call(this._entityManager, xToken.name);


         // §5.1: Except when standalone="yes", [non-validating processors] must not
         // process entity declarations or attribute-list declarations encountered after
         // a reference to a parameter entity that is not read, since the entity may
         // have contained overriding declarations.
         if (this.processMode === ProcessMode.NON_VALIDATING && isPeRef) {
            this.skipDeclarations = true;
         }

         if (declarationSource) {
            if (isPeRef && (this.processMode === ProcessMode.STANDALONE || this.processMode === ProcessMode.NON_VALIDATING)) {
               // no need to expand in either of these cases.
            } else {
               const tokenType: any = isPeRef ? ParameterEntityStartXToken : GeneralEntityStartXToken;
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
               (pTokenStream as any).pipe(tokenizer).pipe(this._child.stream);   // typeHack
               return;
            }
         } else {
            // From 4.1 well formedness constraint: entity declared
            // For a document without any DTD, an entity reference must be to one of amp, lt, gt, apos or quote
            // For a document with only an internal DTD subset with no param entity references
            //    (presumably even those in entity values, though that is irrelevant here) the name must must reference a declaration.
            // For a document that is standalone = yes, name must again match a declaration
            // This means one with a DTD, or an external DTD, or param references, it need not match a declaration (though validity will catch those)
            // This has nothing to do with validating or not, interestingly.
            // however,  parameter entity reference will stop all further processing if this is non-validating

            const startToken = xToken.pToken && xToken.pToken.open;
            const error = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION,
               [ xToken.name ], startToken, startToken);
            this.push(error);
         }
      } else if ((xToken instanceof GeneralEntityDeclarationXToken || xToken instanceof ParameterEntityDeclarationXToken) && !this.skipDeclarations) {
         this._processEntityDeclaration(xToken, callback);
         return;
      } else if (xToken instanceof elementDeclaration.XToken && !this.skipDeclarations) {
         this._processElementDeclaration(xToken, callback);
         return;
      } else if (xToken instanceof notationDeclaration.XToken && !this.skipDeclarations) {
         this._processNotationDeclaration(xToken, callback);
         return;
      } else if (xToken instanceof attListDeclaration.XToken && !this.skipDeclarations) {
         this._processAttListDeclaration(xToken, callback);
         return;
      } else if (xToken.type === elementStart.XTYPE || xToken.type === elementStart.EMPTY_XTYPE) {
         this._processElementStart((xToken as ElementStart), callback);
         return;
      } else if (xToken.type === docTypeEnd.XTYPE) {
         if (this.docTypeStart && this.docTypeStart.hasInternalSubset) {
            this.push(new InternalSubsetEndXToken());
         }

         if (this.docTypeStart && this.docTypeStart.externalLoc) {
            this.push(new ExternalSubsetStartXToken());
            this.push(new ExternalSubsetEndXToken());
         }
      } else if (xToken.type === XMLDECL_XTOKEN) {
         if (this.processMode === ProcessMode.NON_VALIDATING && (xToken as XmlDeclarationXToken).standalone) {
            this.processMode = ProcessMode.STANDALONE;
         }
      }

      this.push(xToken);

      if (xToken.type === docTypeStart.XTYPE) {
         this.docTypeStart = xToken as DocTypeStartXToken; // typeHack

         if (this.docTypeStart.hasInternalSubset) {
            this.push(new InternalSubsetStartXToken());
         }
      }

      callback();
   }

   _childData(data: XToken) {
      this.push(data);
   }

   _childDone() {
      const isPeRef = (this._child.xToken instanceof ParameterEntityReferenceXToken);
      const tokenType = isPeRef ? ParameterEntityEndXToken : GeneralEntityEndXToken;

      this._child.stream.removeListener('data', this._childData);
      this._child.stream.removeListener('end', this._childDone);

      this.push(new (tokenType as any)(this._child.xToken.name)); // typeHack

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
   _expandThroughNextPERef(unassignedArray: UnassignedArray /* always defined */, deliverExpanded: (expanded: UnassignedArray, other?: UnassignedArray) => void) {
      const preExpanded: UnassignedArray = [];

      while (unassignedArray.length > 0) {
         const item = unassignedArray.shift()!; // we just checked the length, above

         if (item.type === UnassignedType.REFERENCE) {
            this._expandPERefFully(item.token, (expandedItem) => {
               deliverExpanded(preExpanded, expandedItem);
            });
            return;
         } else {
            preExpanded.push(item);
         }
      }

      deliverExpanded(preExpanded);
   }

   /*
    * Same as above, but for entity values @@@@
    * Could we essentially do the above, and then post-process by unwraping the unassigned objects?
    */
   _expandThroughNextPERefInEntityValue(entityValueArray: EntityValueArray, deliverExpanded: (expanded: EntityValueArray, other?: EntityValueArray) => void) {
      if (!entityValueArray || entityValueArray.length === 0) {
         deliverExpanded([]);
         return;
      }

      const preExpanded: EntityValueArray = [];

      while (entityValueArray.length > 0) {
         const item = entityValueArray.shift();

         // @@ dont do this if it is a parameter and this is standalone. Not clear an entity reference is even allowed here.
         if (item!.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {  // typeHack
            this._expandPERefFullyInEntityValue(item as ParameterEntityReferencePToken, (expandedItem) => {   // This is going to be a problem
               deliverExpanded(preExpanded, expandedItem);
            });
            return;
         } else {
            preExpanded.push(item!); // typeHack
         }
      }

      deliverExpanded(preExpanded);
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
   _expandPERefFully(peRef: ParameterEntityReferencePToken, deliverExpanded: (expanded: UnassignedArray) => void) {
      const itemName = peRef.name && peRef.name.str || '';
      const entityToken: ParameterEntityDeclarationPToken = this._entityManager.getParameterEntityToken(itemName);

      // @@@ don't expand if it is a standalone
      if (!entityToken || !entityToken.value) {
         deliverExpanded([ {
            type: UnassignedType.REFERENCE,
            token: peRef,
         } ]);
      } else {
         const expanded = this._entityValueToUnassignedArray((entityToken as any).value);
         expanded.unshift({
            type: UnassignedType.ENTITY_START,
            token: peRef,
         });
         expanded.push({
            type: UnassignedType.ENTITY_END,
            token: peRef,
         });

         deliverExpanded(expanded);
      }
   }

   _entityValueToUnassignedArray(entityValue: EntityValueArray): UnassignedArray {
      const result: UnassignedArray = [];

      for (const val of entityValue) {
         switch (val.type) {
            case text.PTYPE:
               result.push({
                  type: UnassignedType.WORD, // could be space!
                  token: val as TextPToken, // typeHack
               });
               break;
            case PARAMETER_ENTITY_REFERENCE_PTOKEN:
               result.push({
                  type: UnassignedType.REFERENCE, // could be space!
                  token: val as ParameterEntityReferencePToken, // typeHack
               });
               break;
         }
      }

      return result;
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
   _expandPERefFullyInEntityValue(peRef: ParameterEntityReferencePToken, deliverExpanded: (expanded: EntityValueArray) => void) {
      const itemName = peRef.name && peRef.name.str || '';
      const entityToken = this._entityManager.getParameterEntityToken(itemName);

      // @@@ don't expand if it is in standalone
      if (!entityToken) {
         deliverExpanded([ peRef ]);
      } else {
         const expanded: EntityValueArray = [ new ParameterEntityStartPToken(peRef) ]
            .concat(entityToken.value);
         expanded.push(new ParameterEntityEndPToken(peRef));

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
   _expandPERefsInUnassignedValue(pToken: PToken | void, includeNameListChars: boolean, done: DoneSignal) {
      if (!pToken || !pToken.unassigned) {
         done();
         return;
      }

      this._expandThroughNextPERef(pToken.unassigned, (leadingUnassignedValues, possiblyExpandedPERef) => {
         if (!possiblyExpandedPERef) {
            pToken.unassigned = leadingUnassignedValues;
            done();
            return;
         }

         const startOrRef = possiblyExpandedPERef.shift()!;
         const end = possiblyExpandedPERef.pop() || [];

         this._parsePERefTexts(possiblyExpandedPERef, includeNameListChars, (values) => {
            pToken.unassigned = leadingUnassignedValues.concat(startOrRef, values, end, pToken.unassigned!);
            done();
         });
      });
   }

   /*
    * Break down the text values in the pereferences into normal
    * unassigned values.
    */
   _parsePERefTexts(peRefContents: UnassignedArray, includeNameListChars: boolean, deliverValues: (parsed: UnassignedArray) => void) {
      const source = new STokenSource(defaultExtractors as any, new EntityMetaData()); // typeHack

      for (let index = 0; index < peRefContents.length; index++) {
         const item = peRefContents[index];

         //  This is NOT sufficient. We could have literals in here.
         if (item.type === UnassignedType.WORD || item.type === UnassignedType.SPACE) {
            const sToken = item.token.text!;

            source.addText(sToken.originalStr, sToken.ranges[0]); // there will only ever be one
         }
      }
      source.endText();

      // setTimeout() candidate
      unassigned.parseAllValues(source, includeNameListChars, (result) => {
         deliverValues(result!);
      });
   }

   /**********************************************************************\
    AttList Declaration processing
   \**********************************************************************/

   _processAttListDeclaration(alToken: AttListXToken, done: DoneSignal) {
      // @@ this should not happen in the internal subset
      this._expandPERefsInUnassignedValue(alToken.pToken, true, () => {
         const open = alToken.pToken && alToken.pToken.open;

         if (alToken.pToken && alToken.pToken.unassigned) {
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

   _processElementDeclaration(edXToken: ElementDeclaration, done: DoneSignal) {
      // @@ this should not happen in the internal subset
      this._expandPERefsInUnassignedValue(edXToken.pToken, true, () => {
         this._examineUnassigned(edXToken);

         if (edXToken.pToken && edXToken.pToken.unassigned) {
            elementDeclaration.assignUnassigned(edXToken.pToken);
            edXToken = elementDeclaration.pTokenToXToken(edXToken.pToken);
         }

         this.push(edXToken);
         done();
      });
   }

   /*
    * Examine the unassigned values, and address these concerns from
    * §3.2.1 Validity Constraint: Proper Group/PE Nesting
    *    Parameter-entity replacement text must be properly nested with
    *    parenthetized groups. That is to say, if either of the opening
    *    or closing parentheses in a choice, seq, or Mixed construct is
    *    contained in the replacement text for a parameter entity, both
    *    must be contained in the same replacement text.
    *
    * §3.2.1: Interoperability note:
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
   _examineUnassigned(edXToken: ElementDeclaration) {
      if (!edXToken.pToken) {
         return;
      }

      const pToken = edXToken.pToken;
      const elName = edXToken.name;
      const unassignedArray = pToken.unassigned || [];
      let insideContentSpec = !!pToken.children;
      let entityDepth = 0;
      let parenDepth = 0;
      let sawNonWhite = false;
      let endedWithConnector = false;
      let topEntityRef: ParameterEntityReferencePToken | void;

      // @@ maybe don't do if it is a standalone
      if (pToken.children && pToken.children.close) {
         return;
      }

      for (const entry of unassignedArray) {
         switch (entry.type) {
            case 'entityStart':
               entityDepth++;
               if (entityDepth === 1) {
                  topEntityRef = entry.token;
               }
               break;
            case UnassignedType.ENTITY_END:
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
                  [ elName, topEntityRef.name!.str ], topEntityRef.open, pToken.open); // typeHack
               this.push(error);
            }

            if (endedWithConnector) {
               const warning = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
                  [ elName, topEntityRef.name!.str ], topEntityRef.open, pToken.open); // typeHack
               this.push(warning);
            }

            if (!sawNonWhite) {
               const warning = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
                  [ elName, topEntityRef.name!.str ], topEntityRef.open, pToken.open); // typeHack
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

   _processElementStart(startXToken: ElementStart | ElementEmpty, done: DoneSignal) {
      if (!startXToken.attributes || startXToken.attributes.length === 0) {
         this.push(startXToken);
         done();
         return;
      }

      const openSToken = startXToken.pToken && startXToken.pToken.open;

      this._expandAttributeValues(startXToken.attributes, openSToken, () => {
         //
         // §2.12: Language Identification
         // The value of the xml:lang attribute must match a particular
         // set of syntactic constraints. Note if this does not have expanded
         // references, we assume this check was done at initial check time
         //
         for (const attr of startXToken.attributes) {
            const lcName = attr.name.toLowerCase();

            if (lcName === 'xml:lang') {
               if (attr.value.some((item) => item.type === GENERAL_ENTITY_START_XTOKEN)) {
                  const havePTokens = attr.value.filter((item) => !!item.pToken);
                  const firstPToken = havePTokens[0]; // because we have expanded, we'll always have ptokens
                  const firstSToken = (firstPToken as any).pToken.text || (firstPToken as any).pToken.open;
                  const ec = new ErrorCollector(firstSToken, WellFormedError);

                  checkXmlLangWellFormed(attr.value, ec, new EntityMetaData()); // where is our emd?

                  for (const error of ec.errors) {
                     this.push(error);
                  }
               }
            }
         }

         this.push(startXToken);
         done();
      });
   }

   _expandAttributeValues(attributeArray: Array<CommonAttributeXToken>, openSToken: SToken | void, done: DoneSignal) {
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

   _expandAttributeValue(attrValue: AttributeValueXToken, attrExpanded: (expanded: AttributeValueXToken) => void) {
      if (attrValue.length === 0) {
         attrExpanded(attrValue);
         return;
      }

      let count = 0;
      let doneProcessing = false;
      const expansions: ExpansionsMap = {};
      const self = this;

      function referenceExpanded(refData: LiteralValueXToken | GeneralEntityReferenceXToken, refIndex: number) {
         expansions[refIndex] = refData;
         count--;

         if (count === 0 && doneProcessing) {
            self._buildExpandedAttrValue(attrValue, expansions, attrExpanded);
         }
      }

      for (let index = 0; index < attrValue.length; index++) {
         const item = attrValue[index];

         if (item.type === GENERAL_ENTITY_REFERENCE_XTOKEN) {
            count++;
            this._expandReference((item as GeneralEntityReferenceXToken), index, referenceExpanded); // typeHack
         }
      }

      doneProcessing = true;
      if (count === 0 && doneProcessing) {
         this._buildExpandedAttrValue(attrValue, expansions, attrExpanded);
      }
   }

   _buildExpandedAttrValue(originalAttrValue: AttributeValueXToken, expansions: ExpansionsMap, attrExpanded: (expanded: AttributeValueXToken) => void) {
      let newValue: AttributeValueXToken = [];

      for (let index = 0; index < originalAttrValue.length; index++) {
         const item = originalAttrValue[index];

         if (item.type === GENERAL_ENTITY_REFERENCE_XTOKEN) {
            newValue = newValue.concat(expansions[index]);
         } else {
            newValue.push(item);
         }
      }

      attrExpanded(newValue);
   }

   _scanValueForBadText(name: string, value: ExpandedLiteralValueXToken, sToken: SToken | void) {
      let entityDepth = 0;

      // Well-formedness constraint: §3.1: No < in Attribute Values
      //   The replacement text of any entity referred to directly or indirectly
      //   in an attribute value must not contain a <.
      for (const valuePart of value) {
         if (valuePart.type === GENERAL_ENTITY_START_XTOKEN) {
            entityDepth++;
         } else if (valuePart.type === GENERAL_ENTITY_END_XTOKEN) {
            entityDepth--;
         } else if (valuePart.type === text.XTYPE && entityDepth > 0) {
            // Don't report on things at depth 0 because attribute.checkWellFormed() already did.
            const textValuePart: TextXToken = (valuePart as TextXToken); // typeHack

            if (textValuePart.text && textValuePart.text.indexOf('<') !== -1) {
               const error = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
                  [ name ], sToken, sToken);
               this.push(error);
            }
         }
      }
   }

   _expandReference(entityRef: GeneralEntityReferenceXToken, indexInAttr: number, referenceExpanded: (expanded: LiteralValueXToken | GeneralEntityReferenceXToken, index: number) => void) {
      const entityInfo = this._entityManager.getEntityInfo(entityRef.name);
      if (!entityInfo) {
         referenceExpanded(entityRef, indexInAttr);
         return;
      }
      // Note.  Pass a bad reference in, and this will barf

      // Well-formedness Constraint: §3.1: No External Entity References
      //    Attribute values must not contain direct or indirect entity
      //    references to external entities.
      if (!entityInfo.isInternal) {
         const sToken = entityRef.pToken && entityRef.pToken.open;
         const error = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            [ entityRef.name ], sToken, sToken);
         this.push(error);
      }

      const sTokenStream = entityInfo.getStream();

      literalValue.parse(sTokenStream, [ '&' ], (pTokenResult) => {
         const xToken = literalValue.makeXTokenCompatible(pTokenResult);

         this._expandAttributeValue(xToken, (subXToken: Array<any>) => { // typeHack
            subXToken.unshift(new GeneralEntityStartXToken(entityRef.name));
            subXToken.push(new GeneralEntityEndXToken(entityRef.name));
            referenceExpanded(subXToken, indexInAttr);
         });
      });
   }

   /**********************************************************************\
    Entity Declaration processing
   \**********************************************************************/

   _processEntityDeclaration(edToken: GeneralEntityDeclarationXToken | ParameterEntityDeclarationXToken, done: DoneSignal) {
      const isParameterEntity = edToken.type === PARAMETER_ENTITY_DECLARATION_XTOKEN;
      const isExternalEntity = edToken.externalLoc;

      // This is a bit hard to reason about.  The specification does say something
      // definitive, but doesn't do it in a place you would expect, so you must
      // examine several places:
      // §2.9 An external markup declaration is defined as a markup declaration
      // occurring in the external subset or in a parameter entity (external
      // or internal, the latter being included because non-validating
      // processors are not required to read them).]
      // SUMMARY: A non-validating processor it nos obligated to read any parameter
      // entity ("read" is never defined precisely).
      // §4.1
      // Note that non-validating processors are not obligated to read and process
      // entity declarations occurring in parameter entities or in the external subset;
      // SUMMARY: This section only speaks of nor reading entity declarations in
      // PE declarations. But this whole section is only about entities, so this
      // doesn't seem to contradict 2.9
      // §5.1 Non-validating processors are required to check only the
      // document entity, including the entire internal DTD subset,
      // for well-formedness. While they are not required to check the
      // document for validity, they are required to process all the declarations
      // they read in the internal DTD subset and in any parameter entity that
      // they read, up to the first reference to a parameter entity that they
      // do not read; that is to say, they must use the information in those
      // declarations to normalize attribute values, include the replacement
      // text of internal entities, and supply default attribute values
      // §5.2 [non-validating processors] need not read any part of the
      // document other than the document entity.
      // SUMMARY: In conjunction with 2.9, this does say that a processor
      // need not read any parameter entities. And of course this also
      // says a non-validating processor need not read any external entities.

      if (this.processMode === ProcessMode.NON_VALIDATING && (isParameterEntity || isExternalEntity)) {
         done();
         return;
      }

      // Store the reference just in case we need to recognize that it was declared later on.
      // Crucially, the only place this can be referenced in standalone is in the internal
      // subset body, where we do not expand it.
      if (this.processMode === ProcessMode.STANDALONE && isParameterEntity) {
         this._addEntityDeclaration(edToken, done);
         return;
      }

      // @@ this should not happen in the internal subset
      this._expandPERefsInUnassignedValue(edToken.pToken, false, () => {
         if (edToken.pToken && edToken.pToken.unassigned) {
            entityDeclaration.assignUnassigned(edToken.pToken as any); // typeHack
            edToken = entityDeclaration.pTokenToXToken(edToken.pToken as any); // typeHack
         }

         // @@ this can only happen in the external subset
         this._expandPeRefsInEntityValue((edToken.value as EntityValueArray), (newValue) => {
            edToken.value = newValue as any; // typeHack
            this._addEntityDeclaration(edToken, done);
         });
      });
   }

   _expandPeRefsInEntityValue(entityValue: EntityValueArray, deliverExpanded: (expanded: EntityValueArray) => void) {
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

   _addEntityDeclaration(edToken: ParameterEntityDeclarationXToken | GeneralEntityDeclarationXToken, done: DoneSignal) {
      if (edToken instanceof ParameterEntityDeclarationXToken) {
         // §4.2 If the same entity is declared more than once, ... at user option,
         // an XML processor may issue a warning if entities are declared multiple times.
         if (this._entityManager.getParameterEntityToken(edToken.name)) {
            const warning = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, [ edToken.name ]);
            this.push(warning);
            done();
            return;
         }

         this._entityManager.addParameterEntityFromInternalSubset(edToken);
      } else {
         // §4.2 If the same entity is declared more than once, ... at user option,
         // an XML processor may issue a warning if entities are declared multiple times.
         if (this._entityManager.getEntityToken(edToken.name)) {
            const warning = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, [ edToken.name ]);
            this.push(warning);
            done();
            return;
         }

         this._entityManager.addEntityFromInternalSubset(edToken);
      }

      this.push(edToken);
      done();
   }

   /**********************************************************************\
    Notation Declaration processing
   \**********************************************************************/

   _processNotationDeclaration(ndToken: NotationDeclaration, done: DoneSignal) {
      // @@ This is getting into 4.1 area, but there should be no unassigned values in the internal subset
      this._expandPERefsInUnassignedValue(ndToken.pToken, false, () => {
         if (ndToken.pToken && ndToken.pToken.unassigned) {
            if (ndToken.pToken.externalId) {
               ndToken.pToken.externalId.unassigned = ndToken.pToken.unassigned;
            }

            notationDeclaration.assignUnassigned(ndToken.pToken);
            ndToken = notationDeclaration.pTokenToXToken(ndToken.pToken);
         }

         this.push(ndToken);
         done();
      });
   }

}

export default NodeStream;
