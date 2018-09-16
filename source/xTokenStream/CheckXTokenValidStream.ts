/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData, util } from '../basic';
import { ValidityError, XmlError, XmlWarning } from '../error';
import { SToken } from '../sToken';
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
import { AttListXToken, AttDefXToken, AttDefPToken, AttListPToken } from '../token/attListDeclaration';
import { AttributeXToken } from '../token/common/attribute';
import { ElementDeclaration, isXName, XNameList } from '../token/elementDeclaration';
import { ElementStart } from '../token/elementStart';
import nameList, { XName } from '../token/common/nameList';
import { Graph } from '../token/common/nameListGraphTypes';

import EntityManager from '../expand/EntityManager.js';

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
      [attrName: string]: AttDefXToken,
   },
}

type MixedChildrenMap = {
   [xName: string]: true;
};

type AnyDeclInfo = {
   type: 'ANY',
   token: ElementDeclaration,
}

type EmptyDeclInfo = {
   type: 'EMPTY',
   token: ElementDeclaration,
}

type MixedDeclInfo = {
   type: 'MIXED',
   token: ElementDeclaration,
   children: MixedChildrenMap,
}

type ChildrenDeclInfo = {
   type: 'CHILDREN',
   token: ElementDeclaration,
   graph: Graph,
}

type ChildrenContext = {
   type: 'ACTIVE-CHILDREN',
   token: ElementDeclaration,
   graph: Graph,
   stateId: number;
}

type ElementDeclInfo = AnyDeclInfo | EmptyDeclInfo | MixedDeclInfo | ChildrenDeclInfo;
type ContentContext = {
   declInfo: ElementDeclInfo,
   stateId: number;
}

type IDMap = {
   [idValue: string]: {
      token: ElementStart,
      attrName: string,
   }
};

type AttributeMap = { [name: string] : AttributeXToken };

/*
 * §3.3.3: Attribute value normalization.
 * This should be done whether or not we are validating.
 */
function normalizeAttributeValue(attribute: any, attrDef?: AttDefXToken): any { // typeHack
   const isCData = !attrDef || attrDef.type === 'CDATA';
   let prevHadTrailingSpace = true; // consider the start to already be space terminated
   let prevPiece: { text: string } | void = undefined;
   const newValue = [];

   if (!attribute.value) {
      return;
   }

   for (let index = 0; index < attribute.value.length; index++) {
      const piece = attribute.value[index];

      if (!text.isTextXToken(piece)) {
         newValue.push(piece)
         continue;
      }

      const newPiece = new text.XToken(piece.text, piece.pToken);
      newValue.push(newPiece);

      if (isCData) {
         newPiece.text = newPiece.text.replace(/[ \r\n\t]/g, ' ');
      } else {
         newPiece.text = newPiece.text.replace(/[ \r\n\t]+/g, ' ');

         if (prevHadTrailingSpace) {
            newPiece.text = newPiece.text.replace(/^ /, '');
         }

         prevPiece = newPiece;
         prevHadTrailingSpace = newPiece.text[newPiece.text.length - 1] === ' ';
      }
   };

   if (prevHadTrailingSpace && prevPiece) {
      prevPiece!.text = prevPiece!.text.replace(/ $/, ''); // typeHack
   }

   return newValue;
}

function getAttributeValueText(attribute: any): string {
   const rawValue = attribute.value;
   let newValue = '';

   rawValue.forEach((value: any) => { // typeHack
      if (text.isTextXToken(value)) {
         newValue += value.text;
      }
   });

   return newValue;
}

class CheckXTokenValidStream extends stream.Transform {
   private entityManager: EntityManager;
   private docType: XToken | void;
   private notations: { [name: string]: XToken };
   private attrDefsByElementName: ElementAttributes;
   private elementDeclarations: { [name: string]: ElementDeclInfo };
   private contentStack: Array<ContentContext>;
   private currentContext: ContentContext | void;
   private idValues: IDMap;
   private unanchoredIDRefs: IDMap;
   private emd: EntityMetaData = new EntityMetaData();
   private _seenRoot: boolean = false;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(entityManager: EntityManager) {
      super({
         objectMode: true,
      });

      this.entityManager = entityManager;
      this.docType = undefined;
      this.notations = {};
      this.attrDefsByElementName = {};
      this.elementDeclarations = {};
      this.contentStack = [];
      this.currentContext = undefined;
      this.idValues = {};
      this.unanchoredIDRefs = {};
   }

   private pushValidityError(id: string, params: Array<string>, pos?: SToken|void, context?: SToken|void) {
      const error = new ValidityError(id, params, pos, context);

      this.push(error);
   }

   private pushWarning(id: string, params: Array<string>, pos?: SToken|void, context?: SToken|void) {
      const warning = new XmlWarning(id, params, pos, context);

      this.push(warning);
   }

   private checkContextValidity(xToken: XToken, sToken: SToken|void, context: ContentContext | void) {
      if (!context) {
         return;
      }
      let declInfo = context.declInfo;

      if (declInfo.type === 'EMPTY') {
         if (!(xToken instanceof elementEnd.XToken)) {
            this.pushValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
               [ declInfo.token.name ], sToken);
         }
      } else if (declInfo.type === 'ANY') {
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
         const notAllowedParams = [ declInfo.token.name, this.emd.version.toString(), this.emd.revision.toString() ];
         let error;

         if (allowed && (xToken.type === cdata.XTYPE || xToken.type === processingInstruction.XTYPE || xToken.type === comment.XTYPE)) {
            return;
         }

         switch (xToken.type) {
            case elementStart.XTYPE:
            case elementStart.EMPTY_XTYPE:
               if (!this.elementDeclarations[xToken.name]) {
                  this.pushValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT,
                     [ declInfo.token.name, xToken.name ], sToken);
               }
               break;
            case elementEnd.XTYPE:
            case charData.XTYPE:
            case entityReference.XTYPE:
            case entityStart.XTYPE:
            case entityEnd.XTYPE:
            case space.XTYPE:
               // These are all OK here
               break;
            case cdata.XTYPE:
               this.pushValidityError(ValidityError.ID.ANY_XTRA_CDATA, notAllowedParams, sToken);
               break;
            case processingInstruction.XTYPE:
               this.pushValidityError(ValidityError.ID.ANY_XTRA_PI, notAllowedParams, sToken);
               break;
            case comment.XTYPE:
               this.pushValidityError(ValidityError.ID.ANY_XTRA_COMMENT, notAllowedParams, sToken);
               break;
            default:
               this.pushValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ declInfo.token.name ], sToken);
               break;
         }
      } else if (declInfo.type === 'MIXED') {
         switch (xToken.type) {
            case elementStart.XTYPE:
            case elementStart.EMPTY_XTYPE:
               if (!declInfo.children[xToken.name]) {
                  this.pushValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                     [ declInfo.token.name, xToken.name ], sToken);
               }
               break;
            case charData.XTYPE:
            case cdata.XTYPE: // wanna revisit this given the decision in ANY?
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
                  this.pushValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                     [ declInfo.token.name ], sToken);
               }
               break;
            default:
               this.pushValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                  [ declInfo.token.name ], sToken);
               break;
         }
      } else { // 'CHILDREN'
         // Addresses Section §3.0 Validity Constraint: Element Valid
         //  1.0/1: 2. The declaration matches children and the sequence of child elements
         //       belongs to the language generated by the regular expression in the content
         //       model, with optional white space (characters matching the nonterminal S)
         //       between each pair of child elements.
         //  1.0/2: 2. The declaration matches children and the sequence of child elements
         //       belongs to the language generated by the regular expression in the content
         //       model, with optional white space (characters matching the nonterminal S)
         //       between the start-tag and the first child element, between child elements,
         //       or between the last child element and the end-tag. Note that a CDATA
         //       section containing only white space does not match the nonterminal S,
         //       and hence cannot appear in these positions
         //  Other. The declaration matches children and the sequence of child elements
         //       belongs to the language generated by the regular expression in the
         //       content model, with optional white space, comments and PIs (i.e. markup
         //       matching production [27] Misc) between the start-tag and the first child
         //       element, between child elements, or between the last child element and
         //       the end-tag. Note that a CDATA section containing only white space or a
         //       reference to an entity whose replacement text is character references
         //       expanding to white space do not match the nonterminal S, and hence cannot
         //       appear in these positions; however, a reference to an internal entity with
         //       a literal value consisting of character references expanding to white
         //       space does match S, since its replacement text is the white space
         //       resulting from expansion of the character references.
         const allowed = (this.emd.isVersion1dot0 && this.emd.revision >= 3) || this.emd.isVersion1dot1;
         const notAllowedParams = [ declInfo.token.name, this.emd.version.toString(), this.emd.revision.toString() ];
         let error;

         if (allowed && (xToken.type === processingInstruction.XTYPE || xToken.type === comment.XTYPE)) {
            return;
         }
         const currentState = declInfo.graph.states[context.stateId];

         switch (xToken.type) {
            case elementStart.XTYPE:
            case elementStart.EMPTY_XTYPE:
               const destState = currentState.trans[xToken.name];
   
               if (!destState) {
                  this.pushValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT,
                     [ declInfo.token.name, xToken.name ], sToken);
               } else {
                  context.stateId = destState.stateId;
               }
               break;
            case elementEnd.XTYPE:
               if (currentState.done !== true) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_UNEXPECTED_END, [ declInfo.token.name,
                     Object.keys(currentState.trans).join(', ') ], sToken);
               }
               break;
            case entityReference.XTYPE:
            case entityStart.XTYPE:
            case entityEnd.XTYPE:
            case space.XTYPE:
               // These are all OK here
               break;

            case charData.XTYPE:
               if (!util.isSpace(xToken.text)) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, notAllowedParams, sToken);
               }
               break;
            case processingInstruction.XTYPE:
               this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_PI, notAllowedParams, sToken);
               break;
            case comment.XTYPE:
               this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, notAllowedParams, sToken);
               break;
            default:
               this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, notAllowedParams, sToken);
               break;
         }
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
            this.pushValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ xToken.name ], pToken);
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
         if (!this._seenRoot) {
            if (this.docType && xToken.name !== this.docType.name) {
               this.pushValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this.docType.name, xToken.name ],
                     this.docType.pToken.open);
            }
            this._seenRoot = true;
         }

         if (xToken instanceof elementStart.XToken) {
            if (this.currentContext) {
               this.contentStack.push(this.currentContext);
            }

            if (this.elementDeclarations[xToken.name]) {
               this.currentContext = {
                  declInfo: this.elementDeclarations[xToken.name],
                  stateId: 0,
               };
            } else {
               this.currentContext = {
                  declInfo: {
                     token: new ElementDeclaration(xToken.name, 'ANY', undefined),
                     type: 'ANY',
                  },
                  stateId: 0,
               };
            }
         }

         this.validateElementStart(xToken);
      } else if (xToken instanceof elementEnd.XToken) {
         this.currentContext = this.contentStack.pop();

         if (this.contentStack.length === 0) {
            this.validateDocumentEnd();
         }
      } else if (xToken instanceof docTypeEnd.XToken) {
         this.validateDTD();
      }

      if (xToken instanceof EntityMetaData) {
         this.emd = xToken;
      }

      this.push(xToken);

      done();
   }

   private validateAttListDecl(attListDecl: AttListXToken) {
      const openSToken = attListDecl.pToken && attListDecl.pToken.open;
      const elName = attListDecl.elementName;
      let attrDefs = this.attrDefsByElementName[elName];

      // Note: We do not report on these cases from §3.3.0 because the spec doesn't seem
      // to encourage a warning: For interoperability, writers of DTDs may choose to
      // provide ... at most one attribute definition for a given attribute name in
      // an attribute-list declaration, and at least one attribute definition in each
      // attribute-list declaration. 

      if (attrDefs) {
         // §3.3: For interoperability, writers of DTDs may choose to provide at most one
         //   attribute-list declaration for a given element type ... For interoperability,
         //   an XML processor may at user option issue a warning when more than one
         //   attribute-list declaration is provided for a given element type,
         this.pushWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ elName ], openSToken, openSToken);
         attrDefs.tokens.push(attListDecl);
      } else {
         attrDefs = {
            tokens: [ attListDecl ],
            attributes: {},
         };
         this.attrDefsByElementName[elName] = attrDefs;
      }

      // §3.3.0: At user option, an XML processor may issue a warning if attributes are declared for
      //    an element type not itself declared, but this is not an error.
      // Note: This takes the position that if the element wasn't declared before this, it is a warning.
      // Conceivably this should wait until the end of the DTD and then make this assessment.
      if (!this.elementDeclarations[elName]) {
         this.pushWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL, [ elName ], openSToken, openSToken);
      }

      for (let index = 0; index < attListDecl.attDefs.length; index++) {
         const attDef = attListDecl.attDefs[index];

         this.validateAttrDef(attListDecl, attDef);

         if (!attrDefs.attributes[attDef.name]) {
            // §3.3.0: When more than one AttlistDecl is provided for a given element type, the contents of
            //   all those provided are merged. When more than one definition is provided for the same
            //   attribute of a given element type, the first declaration is binding and later
            //   declarations are ignored. ...
            attrDefs.attributes[attDef.name] = attDef;
         } else {
            // §3.3.0: ... For interoperability, an XML processor may at user option
            //   issue a warning when ... more than one attribute definition is provided for a given
            //   attribute, but this is not an error.
            this.pushWarning(XmlWarning.ID.ATTLISTDECL_ATTR_EXTRA_DECLARATION, [ elName, attDef.name ],
               openSToken, openSToken);
         }
      }
   }

   private validateAttrDef(attList: AttListXToken, attDef: AttDefXToken): void {
      const type = attDef.type.toUpperCase();
      const defaultType = attDef.defaultType.toUpperCase();
      const pToken = attList.pToken || {} as AttListPToken; // typeHack
      const oneDotZeroRev3OrHigher = this.emd.isVersion1dot1 || (this.emd.isVersion1dot0 && this.emd.revision > 2);
      const defaultText = getAttributeValueText(attDef);
      const hasDefault = attDef.value.length > 0;

      if (type === 'ID') {
         // §3.3.1: Validity constraint: ID Attribute Default
         //    An ID attribute must have a declared default of #IMPLIED or #REQUIRED.
         if (defaultType !== '#IMPLIED' && defaultType !== '#REQUIRED') {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ attList.elementName, attDef.name, '' ], pToken.open);
         }

         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    It doesn't make a lot of sense for an ID to have a default value, but the spec doesn't
         //    forbid this. We allow it, and follow the spirit of this validity constraint to
         //    require that value be a legitimate name
         if (hasDefault && !util.isName(defaultText, this.emd.version, this.emd.revision)) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_ID_DEFAULT,
               [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }
      } else if (type === 'IDREF' || type === 'ENTITY') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type IDREF or ENTITY must match the Name production;
         if (hasDefault && !util.isName(defaultText, this.emd.version, this.emd.revision)) {
            const code = type === 'IDREF' ? ValidityError.ID.ATTLISTDECL_BAD_IDREF_DEFAULT
               : ValidityError.ID.ATTLISTDECL_BAD_ENTITY_DEFAULT;

            this.pushValidityError(code, [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }
      } else if (type === 'IDREFS' || type === 'ENTITIES') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type IDREFS or ENTITIES must match the Names production;
         if (hasDefault) {
            const names = defaultText.split(/ +/);
            const badNames = [];

            for (const name of names) {
               if (!util.isName(name, this.emd.version, this.emd.revision)) {
                  badNames.push(name);
               }
            }

            if (badNames.length > 0) {
               const code = type === 'IDREFS' ? ValidityError.ID.ATTLISTDECL_BAD_IDREFS_DEFAULT
                  : ValidityError.ID.ATTLISTDECL_BAD_ENTITIES_DEFAULT;
               this.pushValidityError(code, [ attList.elementName, attDef.name, badNames.join(', ') ], pToken.open);
            }
         }
      } else if (type === 'NMTOKEN') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type NMTOKEN must match the Nmtoken production;
         if (hasDefault && !util.isNmToken(defaultText, this.emd.version, this.emd.revision)) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKEN_DEFAULT,
               [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }
      } else if (type === 'NMTOKENS') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type NMTOKENS must match the Nmtokens production;
         if (hasDefault) {
            const names = defaultText.split(/ +/);
            const badNames = [];

            for (const name of names) {
               if (!util.isNmToken(name, this.emd.version, this.emd.revision)) {
                  badNames.push(name);
               }
            }

            if (badNames.length > 0) {
               this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKENS_DEFAULT,
                  [ attList.elementName, attDef.name, badNames.join(', ') ], pToken.open);
            }
         }
      } else if (type === 'NOTATION') {
         // §3.3.1: Validity constraint: Notation Attributes
         //    ...all notation names in the declaration must be declared.
         const notationNames: Array<string> = attDef.enumeration || [];

         for (let index = 0; index < notationNames.length; index++) {
            const notationName = notationNames[index];
            const notationDecl = this.notations[notationName];

            if (!notationDecl) {
               this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION,
                  [ attList.elementName, attDef.name, notationName ], pToken.open);
            }
         }

         if (oneDotZeroRev3OrHigher) {
            // §3.3.1 (for 1.0/>=3): Validity constraint: No Duplicate Tokens
            //    The notation names in a single NotationType attribute declaration [...] must all be distinct.
            const duplicates = this.findDuplicateNamesInEnumeration(notationNames);

            if (duplicates.length > 0) {
               this.pushValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_NOTATION,
                  [ attList.elementName, attDef.name, duplicates.join(', ') ], pToken.open);
            }
         }

         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ... of an enumerated type (either a NOTATION type or an enumeration) must match one of the enumerated values.
         if (hasDefault && notationNames.indexOf(defaultText) === -1) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION_DEFAULT,
               [ attList.elementName, attDef.name, notationNames.join(', '), defaultText ], pToken.open);
         }
      } else if (attDef.type === 'ENUMERATION') {
         const enumerationNames: Array<string> = attDef.enumeration || [];

         if (oneDotZeroRev3OrHigher) {
            // §3.3.1: Validity constraint: No Duplicate Tokens
            //    ...the NmTokens in a single Enumeration attribute declaration, must all be distinct.
            const duplicates = this.findDuplicateNamesInEnumeration(enumerationNames);

            if (duplicates.length > 0) {
               this.pushValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_ENUMERATION,
                  [ attList.elementName, attDef.name, duplicates.join(', ') ], pToken.open);
            }
         }

         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ... of an enumerated type (either a NOTATION type or an enumeration) must match one of the enumerated values.
         if (hasDefault && enumerationNames.indexOf(defaultText) === -1) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_ENUMERATION_DEFAULT,
               [ attList.elementName, attDef.name, enumerationNames.join(', '), defaultText ], pToken.open);
         }
      }
   }

   private findDuplicateNamesInEnumeration(names: Array<string>): Array<string> {
      const nameCounts: { [name: string]: number } = {};
      const duplicates: Array<string> = [];

      for (let index = 0; index < names.length; index++) {
         const notationName = names[index];

         nameCounts[notationName] = nameCounts[notationName] || 0;
         nameCounts[notationName] ++;
      }

      Object.keys(nameCounts).forEach((name) => {
         if (nameCounts[name] > 1) {
            duplicates.push(name);
         }
      });

      return duplicates;
   }

   private validateElementDecl(elDecl: ElementDeclaration): void {
      const openSToken = elDecl.pToken && elDecl.pToken.open;
      let isMixed = false;

      // Validity Constraint: §3.2: Validity constraint: Unique Element Type Declaration
      //    An element type must not be declared more than once.
      if (this.elementDeclarations[elDecl.name]) {
         this.pushValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
            [ elDecl.name ], openSToken);
         return;
      }

      if (elDecl.contentSpecType === 'EMPTY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: elDecl.contentSpecType,
         };
      } else if (elDecl.contentSpecType === 'ANY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: elDecl.contentSpecType,
         };
      } else {
         const children: XNameList = elDecl.children || {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         };

         // §3.2: At user option, an XML processor may issue a warning when a declaration mentions an
         //    element type for which no declaration is provided, but this is not an error.
         const childNamesMap = getNamesFromList(children);
         const childNames = Object.keys(childNamesMap);
         for (let index = 0; index < childNames.length; index++) {
            const childName = childNames[index];

            if (childName.toLocaleUpperCase() === '#PCDATA') {
               isMixed = true;
               continue;
            }

            if (!this.elementDeclarations[childName]) {
               this.pushWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
                  [ elDecl.name, childNames[index] ], openSToken, undefined);
            }
         }
      
         if (isMixed) {
            const childrenNames: MixedChildrenMap = {};

            this.elementDeclarations[elDecl.name] = {
               token: elDecl,
               type: 'MIXED',
               children: childrenNames,
            };

            // §3.2.2: Validity constraint: No Duplicate Types
            //    The same name must not appear more than once in a single mixed-content declaration.
            const names: Array<XName> = children.names as Array<XName>;

            names.forEach((child: XName) => {
               if (childrenNames[child.name]) {
                  this.pushValidityError(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
                     [ elDecl.name, child.name ], openSToken);
               }

               if (child.name && child.name.toLocaleUpperCase() !== '#PCDATA') {
                  childrenNames[child.name] = true;
               }
            });
         } else {
            this.elementDeclarations[elDecl.name] = {
               token: elDecl,
               type: 'CHILDREN',
               graph: nameList.graphFromNameList(children)
            };
         }
      }
   }   

   /*
    * Does all checks that can only be done once we have the whole DTD processed
    */
   private validateDTD() {
      const oneDotZeroRev2OrHigher = this.emd.isVersion1dot1 || (this.emd.isVersion1dot0 && this.emd.revision > 1);
      
      Object.keys(this.attrDefsByElementName).forEach((elementType: string) => {
         const attList = this.attrDefsByElementName[elementType];
         let idCount = 0;
         let notationCount = 0;


         Object.keys(attList.attributes).forEach((name) => {
            const attrDef = attList.attributes[name];

            // §3.3.1: Validity constraint: One ID per Element Type
            //    An element type must not have more than one ID attribute specified.
            if (attrDef.type === 'ID') {
               idCount ++;

               if (idCount > 1) {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID, [ elementType, attrDef.name ], undefined);

               }

            } else if (attrDef.type === 'NOTATION') {
               // §3.3.1: (in 1.0/2+) Validity constraint: One Notation Per Element Type
               //    An element type must not have more than one NOTATION attribute specified.
               notationCount ++;

               if (oneDotZeroRev2OrHigher && notationCount > 1) {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                     [ elementType, attrDef.name ], undefined);
               }

               // §3.3.1 (1.0/2+): Validity constraint: No Notation on Empty Element
               //    For compatibility, an attribute of type NOTATION must
               //    not be declared on an element declared EMPTY.
               if (oneDotZeroRev2OrHigher) {
                  const elementDecl = this.elementDeclarations[elementType];

                  if (elementDecl && elementDecl.type === 'EMPTY') {
                     this.pushValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                           [ elementType, attrDef.name ], undefined);
                  }
               }
            }
         });
      });
   }

   private validateDocumentEnd() {
      Object.keys(this.unanchoredIDRefs).forEach((idName) => {
         // §3.3.1: Validiatity Constraint: IDREF
         //    ... each Name must match the value of an ID attribute on some element in the
         //    XML document; i.e. IDREF values must match the value of some ID attribute.
         const idRefInfo = this.unanchoredIDRefs[idName];
         const pToken = idRefInfo.token.pToken && idRefInfo.token.pToken.open;

         this.pushValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NO_ID,
            [ idName, idRefInfo.token.name, idRefInfo.attrName ], pToken, pToken);
      });
   }

   private validateElementStart(elStart: ElementStart) {
      const elemAttrDef = this.attrDefsByElementName[elStart.name];
      const elementDecl = this.elementDeclarations[elStart.name];
      const attributes = elStart.attributes;
      const pTokenOpen = elStart.pToken && elStart.pToken.open;
      const attributesByName: AttributeMap = {};

      // §3.3.3: Normalization
      for (let index = 0; index < attributes.length; index++) {
         const attrName = attributes[index].name;
         const attrDef = elemAttrDef && elemAttrDef.attributes[attrName];

         attributes[index].value = normalizeAttributeValue(attributes[index], attrDef);

         attributesByName[attrName] = attributes[index];
      }

      if (elemAttrDef) { // This must be required somewhere...
         const attributeNames = [];
         const attDefNames = Object.keys(elemAttrDef.attributes);
         const requiredNames = [];

         // Fill in default values. That is, if the type isn't #REQUIRED, and the attribute is not provided, then use
         // the default value.  (this assumes an attribute of the form myAttr="" is provided).
         // §3.3.2: In an attribute declaration, #REQUIRED means that the attribute must always be provided,
         //      #IMPLIED that no default value is provided. If the declaration is neither #REQUIRED nor
         //      #IMPLIED, then the AttValue value contains the declared default value;
         for (let index = 0; index < attDefNames.length; index ++) {
            const attDefName = attDefNames[index];
            const attDef = elemAttrDef.attributes[attDefName];
            const attribute = attributesByName[attDefName];

            if (attDef.defaultType === '#REQUIRED') {
               requiredNames.push(attDef.name);
            } else if (attDef.value.length > 0) {
               let newAttribute = attribute;

               if (!attribute) {
                  newAttribute = {
                     name: attDefName,
                     value: attDef.value,
                  };
   
                  attributesByName[attDefName] = newAttribute;
                  attributes.push(newAttribute);
               } else if (!attribute.value || attribute.value.length === 0) {
                  attribute.value = attDef.value;
               }
            }
         }

         // §3.1: Validity constraint: Attribute Value Type
         //    The attribute must have been declared; the value must be of
         //    the type declared for it.
         for (let index = 0; index < attributes.length; index++) {
            const attrName = attributes[index].name;
            const attrDef = elemAttrDef.attributes[attrName];
            const attrText = getAttributeValueText(attributes[index]);

            attributeNames.push(attrName); // for use further below.

            if (!attrDef) {
               this.pushValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
                  [ elStart.name, attrName ], pTokenOpen);
            } else if (attrDef.type === 'ID') {
               // §3.3.1: Validity constraint: ID
               //    Values of type ID must match the Name production.  ...
               if (!util.isName(attrText, this.emd.version, this.emd.revision)) {
                  this.pushValidityError(ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
                     [ attrText, elStart.name, attrName ], pTokenOpen);
               }

               // §3.3.1: Validity constraint: ID
               //    ... A name must not appear more than once in an XML document as a value of
               //    this type; i.e., ID values must uniquely identify the elements which bear them.
               const previous = this.idValues[attrText] || {};

               if (previous.token) {
                  this.pushValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                     [ attrText, elStart.name, attrName, previous.token.name, previous.attrName ], pTokenOpen);
               } else {
                  this.idValues[attrText] = {
                     token: elStart,
                     attrName: attrDef.name,
                  }
               }

               // §3.3.1: Validiatity Constraint: IDREF
               //    ... each Name must match the value of an ID attribute on some element in the
               //    XML document; i.e. IDREF values must match the value of some ID attribute.
               if (this.unanchoredIDRefs[attrText]) {
                  delete this.unanchoredIDRefs[attrText];
               }
            } else if (attrDef.type === 'IDREF' || attrDef.type === 'IDREFS') {
               const names = attrText.split(/ +/); // Can't happen once normalization happens
               const badNames = [];

               // §3.3.1: Validity Constraint: IDREF
               //    Values of type IDREF must match the Name production, and
               //    values of type IDREFS must match Names...
               for (let index = 0; index < names.length; index++) {
                  const idRef = names[index];
                  if (!util.isName(idRef, this.emd.version, this.emd.revision)) {
                     badNames.push(idRef);
                  }

                  // §3.3.1: Validiatity Constraint: IDREF
                  //    ... each Name must match the value of an ID attribute on some element in the
                  //    XML document; i.e. IDREF values must match the value of some ID attribute.
                  if (!this.idValues[idRef]) {
                     // Only store the first occurrence.
                     this.unanchoredIDRefs[idRef] = this.unanchoredIDRefs[idRef] || {
                        token: elStart,
                        attrName: attrDef.name,
                     };
                  }
               }

               if (badNames.length > 0) {
                  const code = attrDef.type === 'IDREF' ?
                     ValidityError.ID.ELEMENTSTART_IDREF_NOT_NAME :
                     ValidityError.ID.ELEMENTSTART_IDREFS_NOT_NAME;
                  this.pushValidityError(code, [ badNames.join(', '), elStart.name, attrName ], pTokenOpen);
               }
            } else if (attrDef.type === 'ENTITY' || attrDef.type === 'ENTITIES') {
               const names = attrText.split(/ +/); // Can't happen once normalization happens
               const badNames = [];

               // §3.3.1: Validity Constraint: Entity Name
               //    Values of type ENTITY must match the Name production,
               //    values of type ENTITIES must match Names;
               for (let index = 0; index < names.length; index++) {
                  if (!util.isName(names[index], this.emd.version, this.emd.revision)) {
                     badNames.push(names[index]);
                  }
               }

               if (badNames.length > 0) {
                  const code = attrDef.type === 'ENTITY' ?
                     ValidityError.ID.ELEMENTSTART_ENTITY_NOT_NAME :
                     ValidityError.ID.ELEMENTSTART_ENTITIES_NOT_NAME;
                  this.pushValidityError(code, [ badNames.join(', '), elStart.name, attrName ], pTokenOpen);
               }

               const undeclared = [];
               const parsed = [];

               // §3.3.1: Validity Constraint: Entity Name
               //    each Name must match the name of an unparsed entity declared in the DTD.
               for (let index = 0; index < names.length; index++) {
                  const token = this.entityManager.getEntityToken(names[index])

                  if (!token) {
                     undeclared.push(names[index]);
                  } else if (!token.notationDataName) {
                     parsed.push(names[index]);
                  }
               }

               if (undeclared.length > 0) {
                  const code = attrDef.type === 'ENTITY' ?
                     ValidityError.ID.ELEMENTSTART_ENTITY_NO_ENTITY :
                     ValidityError.ID.ELEMENTSTART_ENTITIES_NO_ENTITY;
                  this.pushValidityError(code, [ undeclared.join(', '), elStart.name, attrName ], pTokenOpen);
               }

               if (parsed.length > 0) {
                  const code = attrDef.type === 'ENTITY' ?
                     ValidityError.ID.ELEMENTSTART_ENTITY_PARSED_ENTITY :
                     ValidityError.ID.ELEMENTSTART_ENTITIES_PARSED_ENTITY;
                  this.pushValidityError(code, [ parsed.join(', '), elStart.name, attrName ], pTokenOpen);
               }
            } else if (attrDef.type === 'NMTOKEN' || attrDef.type === 'NMTOKENS') {
               const names = attrText.split(/ +/);
               const badNames = [];

               // §3.3.1: Validity Constraint: Name Token
               //    Values of type NMTOKEN must match the Nmtoken production;
               //    values of type NMTOKENS must match Nmtokens.
               for (let index = 0; index < names.length; index++) {
                  if (!util.isNmToken(names[index], this.emd.version, this.emd.revision)) {
                     badNames.push(names[index]);
                  }
               }

               if (badNames.length > 0) {
                  const code = attrDef.type === 'NMTOKEN' ?
                     ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN :
                     ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN;
                  this.pushValidityError(code, [ badNames.join(', '), elStart.name, attrName ], pTokenOpen);
               }
            } else if (attrDef.type === 'NOTATION' || attrDef.type === 'ENUMERATION') {
               let declaredNames = attrDef.enumeration || [];

               if (declaredNames.indexOf(attrText) === -1) {
                  if (attrDef.type === 'NOTATION') {
                     // §3.3.1: Validity Constraint: Notation Attributes
                     //    Values of this type must match one of the notation names included in the declaration; ...
                     this.pushValidityError(ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
                        [ attrText, elStart.name, attrName, declaredNames.join(', ') ], pTokenOpen);
                  } else {
                     // §3.3.1: Validity Constraint: Enumeration
                     //    Values of this type must match one of the Nmtoken tokens in the declaration.
                     this.pushValidityError(ValidityError.ID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
                        [ attrText, elStart.name, attrName, declaredNames.join(', ') ], pTokenOpen);
                  }
               }
            }

            // §3.3.2 Validity Constraint: Fixed Attribute Default
            //    If an attribute has a default value declared with the #FIXED keyword,
            //    instances of that attribute must match the default value.
            // §3.3.2 (text): the #FIXED keyword states that the attribute must always have the default value.
            if (attrDef && attrDef.defaultType === '#FIXED') {
               const attrDefaultText = getAttributeValueText(attrDef);
               if (attrText !== attrDefaultText) {
                  this.pushValidityError(ValidityError.ID.ELEMENTSTART_FIXED_NOT_RIGHT,
                     [ elStart.name, attrName, attrDefaultText, attrText ], pTokenOpen);
                  }
            }
         }

         // §3.3.2: Validity Constraint: Required Attribute
         //    If the default declaration is the keyword #REQUIRED, then
         //    the attribute must be specified for all elements of the
         //    type in the attribute-list declaration.
         for (let index = 0; index < requiredNames.length; index++) {
            const requiredName = requiredNames[index];

            if (attributeNames.indexOf(requiredName) === -1) {
               this.pushValidityError(ValidityError.ID.ELEMENTSTART_NO_REQUIRED,
                  [ elStart.name, requiredName ], pTokenOpen, pTokenOpen);
            }
         }
      }

      if (!elementDecl) {
         return;
      }

      // Interoperability: §3.1: For interoperability, the empty-element tag should be
      //    used, and should only be used, for elements which are declared EMPTY.
      const tokenIsEmptyType = elStart instanceof elementStart.EmptyToken;
      const declarationIsEmpty = elementDecl.type === 'EMPTY';
      let warningId;

      if (tokenIsEmptyType && !declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL;
      } else if (!tokenIsEmptyType && declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL;
      }

      if (warningId) {
         this.pushWarning(warningId, [ elStart.name ], pTokenOpen, pTokenOpen);
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
