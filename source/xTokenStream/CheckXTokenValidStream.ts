/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData, util } from '../basic';
import { ValidityError, XmlError, XmlWarning } from '../error';

import {
   charData,
   cdata,
   comment,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   entityEnd,
   entityReference,
   entityStart,
   processingInstruction,
   space,
   text,
   
   elementDeclaration,
   attListDeclaration,
   notationDeclaration,
} from '../token';
import { AttListXToken, XAttr, AttDefPToken, AttListPToken } from '../token/attListDeclaration';
import { ElementDeclaration, isXName, XNameList } from '../token/elementDeclaration';
import { ElementStart } from '../token/elementStart';
import nameList, { XName } from '../token/common/nameList';
import { Graph } from '../token/common/nameListGraphTypes';

type XToken = {
   name: string,
   [name: string]: any,
};

type StreamCallback = (value?: object) => void;

type ElementAttributes = {
   [elementName: string]: AttrDefinitions,
};

type AttrDefinitions = {
   tokens: Array<AttListXToken>,
   attributes: {
      [attrName: string]: XAttr,
   },
}

type ElementDeclInfo = {
   token: ElementDeclaration,
   matcherType: 'EMPTY' | 'MIXED' | 'CHILDREN' | 'ANY',
   mixedMatcher: {
      [key: string]: any
   },
   childrenMatcher?: {
      currentStateId: number,
      graph: Graph,
   },
}

type SeenMapping = {
   [xName: string]: boolean;
};

type IDMap = {
   [idValue: string]: {
      token: ElementStart,
      attrName: string,
   }
};

function getAttributeValueText(attribute: XAttr): string {
   const rawValue = attribute.value;
   let newValue = '';

   rawValue.forEach((value) => {
      if (text.isTextXToken(value)) {
         newValue += value.text;
      }
   });

   return newValue;
}

class CheckXTokenValidStream extends stream.Transform {
   private docType: XToken | void;
   private notations: { [name: string]: XToken };
   private attrDefsByElementName: ElementAttributes;
   private elementDeclarations: { [name: string]: ElementDeclInfo };
   private contentStack: Array<ElementDeclInfo>;
   private currentContext: ElementDeclInfo | void;
   private idValues: IDMap;
   private emd: EntityMetaData = new EntityMetaData();

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });

      this.docType = undefined;
      this.notations = {};
      this.attrDefsByElementName = {};
      this.elementDeclarations = {};
      this.contentStack = [];
      this.currentContext = undefined;
      this.idValues = {};
   }

   private checkContextValidity(xToken: XToken, pToken: any, context: ElementDeclInfo | void) {
      if (context && context.matcherType === 'EMPTY') {
         if (!(xToken instanceof elementEnd.XToken)) {
            const error = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
               [ context.token.name ], pToken);

            this.push(error);
         }
      } else if (context && context.matcherType === 'ANY') {
         // Addresses Section §3.0 Validity Constraint: Element Valid
         //  1.0/1-2: 4. The declaration matches ANY, and the types of any child
         //       elements have been declared.
         //  1.0/3&1.1/1: 4. The declaration matches ANY, and the content (after
         //       replacing any entity references with their replacement text) consists
         //       of character data and child elements whose types have been declared.
         //  Other: The declaration matches ANY, and the content (after replacing any
         //       entity references with their replacement text) consists of character
         //       data , CDATA sections, comments, PIs and child elements whose types
         //       have been declared.
         const allowed = (this.emd.isVersion1dot0 && this.emd.revision > 3) || (this.emd.isVersion1dot1 && this.emd.revision > 1);
         const notAllowedParams = [ context.token.name, this.emd.version.toString(), this.emd.revision.toString() ];
         const pTokenStart = pToken && pToken.open;
         let error;

         if (allowed && (xToken.type === cdata.XTYPE || xToken.type === processingInstruction.XTYPE || xToken.type === comment.XTYPE)) {
            return;
         }

         switch (xToken.type) {
            case elementStart.XTYPE:
            case elementStart.EMPTY_XTYPE:
               if (!this.elementDeclarations[xToken.name]) {
                  error = new ValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT,
                     [ context.token.name, xToken.name ], pTokenStart);
               }
               break;
            case charData.XTYPE:
            case elementEnd.XTYPE:
            case entityReference.XTYPE:
            case entityStart.XTYPE:
            case entityEnd.XTYPE:
            case space.XTYPE:
               // These are all OK here
               break;
            case cdata.XTYPE:
               error = new ValidityError(ValidityError.ID.ANY_XTRA_CDATA, notAllowedParams, pTokenStart);
               break;
            case processingInstruction.XTYPE:
               error = new ValidityError(ValidityError.ID.ANY_XTRA_PI, notAllowedParams, pTokenStart);
               break;
            case comment.XTYPE:
               error = new ValidityError(ValidityError.ID.ANY_XTRA_COMMENT, notAllowedParams, pTokenStart);
               break;
            default:
               error = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ context.token.name ], pTokenStart);
               break;
         }

         if (error) {
            this.push(error);
         }
      } else if (context && context.matcherType === 'MIXED') {
         switch (xToken.type) {
            case elementStart.XTYPE:
            case elementStart.EMPTY_XTYPE:
               if (!context.mixedMatcher[xToken.name]) {
                  const error = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                     [ context.token.name, xToken.name ], pToken);

                  this.push(error);
               }
               break;
            case charData.XTYPE:
            case cdata.XTYPE:
            case elementEnd.XTYPE:
            case entityStart.XTYPE:
            case entityEnd.XTYPE:
            case space.XTYPE:
               // These are all OK here
               break;
            case comment.XTYPE:
            case processingInstruction.XTYPE:
               const expandedMixedAllowance = this.emd.isVersion1dot0 && this.emd.revision >= 3 || this.emd.isVersion1dot1;

               if (!expandedMixedAllowance) {
                  const error = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                     [ context.token.name ], pToken);

                  this.push(error);
               }
               break;
            default:
               const error = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                  [ context.token.name ], pToken);
               this.push(error);
               break;
         }
         // } else if (context && context.matcherType === 'CHILDREN') {
      //    if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
      //       const matcher = context.childrenMatcher;
      //       const currentState = matcher.graph.states[matcher.currentStateId];
      //       const destState = currentState.trans[xToken.name];

      //       if (!destState) {
      //          const error = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
      //             [ context.token.name, xToken.name ], pToken);

      //          this.push(error);
      //       } else {
      //          matcher.currentStateId = destState.stateId;
      //       }
      //    }
      }
   }

   _transform(xToken: XToken, _: string, done: StreamCallback) {
      const pToken = (xToken.pToken || {}).open;
      const context = this.currentContext;

      if (!(xToken instanceof XmlError)) {
         this.checkContextValidity(xToken, pToken, context);
      }

      if (xToken instanceof notationDeclaration.XToken) {
         if (this.notations[xToken.name]) {
            this.push(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE,
               [ xToken.name ], pToken));
         } else {
            this.notations[xToken.name] = xToken;
         }
      } else if (xToken instanceof attListDeclaration.XToken) {
         this.validateAttListDecl(xToken);
      } else if (xToken instanceof elementDeclaration.XToken) {
         this.validateElementDecl(xToken);
      } else if (xToken instanceof docTypeStart.XToken) {
         this.docType = xToken;
      } else if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
         // if (!this._seenRoot) {
         if (this.docType && xToken.name !== this.docType.name) {
            this.push(
               new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this.docType.name, xToken.name ],
                  this.docType.pToken.open));
         }
         // }

         this.currentContext = this.elementDeclarations[xToken.name];
         this.contentStack.push(this.currentContext);

         this.validateElementStart(xToken);
      } else if (xToken instanceof elementEnd.XToken) {
         this.contentStack.pop();
         this.currentContext = this.contentStack[this.contentStack.length - 1];
      } else if (xToken instanceof docTypeEnd.XToken) {
         this.validateDTD();
      }

      if (xToken instanceof EntityMetaData) {
         this.emd = xToken;
      }

      this.push(xToken);

      done();
   }

   private setupContextCheck(context: ElementDeclInfo) {
      // if (!context.token.children) {
      //    return;
      // }
   
      if (context.matcherType === 'MIXED' && context.token.children) {
         const names: Array<XName> = context.token.children.names as Array<XName>;
   
         names.forEach((item: XName) => {
            // if (isXName(item)) {
               if (item.name && item.name.toLocaleUpperCase() !== '#PCDATA') {
                  context.mixedMatcher[item.name] = true;
               }
            // }
         });
      }
   
      // context.childrenMatcher = {
      //    currentStateId: 0,
      //    graph: nameList.processContentExpression(context.token.children)
      // }
   }
   
   private validateAttListDecl(attListDecl: AttListXToken) {
      const openSToken = attListDecl.pToken ? attListDecl.pToken.open : undefined;
      const elName = attListDecl.elementName || '';
      let attrDefs = this.attrDefsByElementName[elName];

      // Note: We do not report on these cases from §3.3: at most one attribute definition for a
      // given attribute name in an attribute-list declaration, and at least one attribute
      // definition in each attribute-list declaration. 

      if (attrDefs) {
         // §3.3: For interoperability, writers of DTDs may choose to provide at most one
         //   attribute-list declaration for a given element type ... For interoperability,
         //   an XML processor may at user option issue a warning when more than one
         //   attribute-list declaration is provided for a given element type,
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ elName ],
            openSToken, openSToken);
         this.push(err);

         attrDefs.tokens.push(attListDecl);
      } else {
         attrDefs = {
            tokens: [ attListDecl ],
            attributes: {},
         };
         this.attrDefsByElementName[elName] = attrDefs;
      }

      // §3.3: At user option, an XML processor may issue a warning if attributes are declared for
      //    an element type not itself declared, but this is not an error.
      // Note: This takes the position that if the element wasn't declared before this, it is a warning.
      // Conceivably this should wait until the end of the DTD and then make this assessment.
      if (!this.elementDeclarations[elName]) {
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
            [ elName ], openSToken, openSToken);
         this.push(err);
      }

      // §3.3: When more than one AttlistDecl is provided for a given element type, the contents of
      //   all those provided are merged. When more than one definition is provided for the same
      //   attribute of a given element type, the first declaration is binding and later
      //   declarations are ignored. ... For interoperability, an XML processor may at user option
      //   issue a warning when ... more than one attribute definition is provided for a given
      //   attribute, but this is not an error.
      for (let index = 0; index < attListDecl.attDefs.length; index++) {
         const attDef = attListDecl.attDefs[index];
         this.validateAttrDef(attListDecl, attDef);
         if (!attrDefs.attributes[attDef.name]) {
            attrDefs.attributes[attDef.name] = attDef;
         } else {
            const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ATTR_EXTRA_DECLARATION, [ elName, attDef.name ],
               openSToken, openSToken);
            this.push(err);
         }
      }
   }

   private validateAttrDef(attList: AttListXToken, attDef: XAttr): void {
      const type = attDef.type.toUpperCase();
      const defaultType = attDef.defaultType.toUpperCase();
      const pToken = attList.pToken || {} as AttListPToken; // typeHack

      if (type === 'ID') {
         // §3.3.1: Validity constraint: ID Attribute Default
         //    An ID attribute must have a declared default of #IMPLIED or #REQUIRED.
         if (defaultType !== '#IMPLIED' && defaultType !== '#REQUIRED') {
            const err = new ValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ attList.elementName, attDef.name, '' ], pToken.open);
            this.push(err);
         }
      }
   }

   private validateElementDecl(elDecl: ElementDeclaration): void {
      const openSToken = elDecl.pToken ? elDecl.pToken.open : undefined;
      let isMixed = false;

      // Validity Constraint: §3.2: Validity constraint: Unique Element Type Declaration
      //    An element type must not be declared more than once.
      if (this.elementDeclarations[elDecl.name]) {
         const err = new ValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
            [ elDecl.name ], openSToken);
         this.push(err);

         return;
      }

      const matcherType = elDecl.contentSpecType === 'EMPTY' || elDecl.contentSpecType === 'ANY'
         ? elDecl.contentSpecType : 'CHILDREN';

      this.elementDeclarations[elDecl.name] = {
         token: elDecl,
         matcherType,
         mixedMatcher: {},
      };

      if (elDecl.children && elDecl.children.names.length > 0) {
         // §3.2: At user option, an XML processor may issue a warning when a declaration mentions an
         //    element type for which no declaration is provided, but this is not an error.
         const childNamesMap = getNamesFromList(elDecl.children);
         const childNames = Object.keys(childNamesMap);
         for (let index = 0; index < childNames.length; index++) {
            const childName = childNames[index];

            if (childName.toLocaleUpperCase() === '#PCDATA') {
               isMixed = true;
               continue;
            }

            if (!this.elementDeclarations[childName]) {
               const err = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
                  [ elDecl.name, childNames[index] ], openSToken);
               this.push(err);
            }
         }
      
         if (isMixed) {
            this.elementDeclarations[elDecl.name].matcherType = 'MIXED';

            // §3.2.2: Validity constraint: No Duplicate Types
            //    The same name must not appear more than once in a single mixed-content declaration.
            const seen: SeenMapping = {};
            const names: Array<XName> = elDecl.children.names as Array<XName>;

            names.forEach((child: XName) => {
               if (seen[child.name]) {
                  const err = new ValidityError(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
                     [ elDecl.name, child.name ], openSToken);
                  this.push(err);
               }
               seen[child.name] = true;
            });
         }

         this.setupContextCheck(this.elementDeclarations[elDecl.name]);
      }
   }

   /*
    * Does all checks that can only be done once we have the whole DTD processed
    */
   private validateDTD() {

      // §3.3.1: Validity constraint: One ID per Element Type
      //    An element type must not have more than one ID attribute specified.
      Object.keys(this.attrDefsByElementName).forEach((elementType: string) => {
         const attList = this.attrDefsByElementName[elementType];
         let idCount = 0;

         Object.keys(attList.attributes).forEach((name) => {
            const attrDef = attList.attributes[name];
            if (attrDef.type === 'ID') {
               idCount ++;

               if (idCount > 1) {
                  const err = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID,
                     [ elementType, attrDef.name ]);
                  this.push(err);
               }
            }
         });
      });
   }

   private validateElementStart(elStart: ElementStart) {
      const elemAttrsDef = this.attrDefsByElementName[elStart.name];
      const elementDecl = this.elementDeclarations[elStart.name];
      const attributes = elStart.attributes || [];

      if (elemAttrsDef) { // This must be required somewhere...
         // Validity Constraint: §3.1: Validity constraint: Attribute Value Type
         //    The attribute must have been declared; the value must be of
         //    the type declared for it.
         for (let index = 0; index < attributes.length; index++) {
            const attrName = attributes[index].name || '';
            const pToken = elStart.pToken;
            const attrDef = elemAttrsDef.attributes[attrName];

            if (!attrDef) {
               const err = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
                  [ elStart.name, attrName ], pToken.open);
               this.push(err);
            } else if (attrDef.type === 'ID') {
               const text = getAttributeValueText(attributes[index]);
               // §3.3.1: Validity constraint: ID
               //    Values of type ID must match the Name production.  ...
               if (!util.isName(text, this.emd.version, this.emd.revision)) {
                  const err = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
                     [ text, elStart.name, attrName ], pToken.open);
                  this.push(err);
               }

               // §3.3.1: Validity constraint: ID
               //    ... A name must not appear more than once in an XML document as a value of
               //    this type; i.e., ID values must uniquely identify the elements which bear them.
               const previous = this.idValues[text] || {};

               if (previous.token) {
                  const err = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                     [ text, elStart.name, attrName, previous.token.name, previous.attrName ], pToken.open);
                  this.push(err);
               } else {
                  this.idValues[text] = {
                     token: elStart,
                     attrName: attrDef.name,
                  }
               }
            }
         }
      }

      if (!elementDecl) {
         return;
      }

      // Interoperability: §3.1: For interoperability, the empty-element tag should be
      //    used, and should only be used, for elements which are declared EMPTY.
      const tokenIsEmptyType = elStart instanceof elementStart.EmptyToken;
      const declarationIsEmpty = elementDecl.matcherType === 'EMPTY';
      let warningId;

      if (tokenIsEmptyType && !declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL;
      } else if (!tokenIsEmptyType && declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL;
      }

      if (warningId) {
         const warning = new XmlWarning(warningId, [ elStart.name ], elStart.pToken.open, elStart.pToken.open);
         this.push(warning);
      }
   }
}

type NamesMap = { [elName: string]: true };

function getNamesFromList(children: XNameList): NamesMap {
   let childNames: NamesMap = {};
   for (let index = 0; index < children.names.length; index++) {
      const child = children.names[index];

      if (isXName(child)) {
         childNames[child.name] = true;
      } else {
         childNames = Object.assign(childNames, getNamesFromList(child)) as NamesMap;
      }
   }

   return childNames;
};


export default CheckXTokenValidStream;
