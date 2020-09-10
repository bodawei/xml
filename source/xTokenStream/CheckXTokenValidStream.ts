/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { ConformanceVersion, isSpace, isName, isNmToken, CONFORMANCE_VERSION } from 'basic';
import { ValidityError, ERROR_TYPE, XmlWarning, WellFormedError } from 'error';
import { SToken, strOrBlank } from 'sToken';
import {
   isTextXToken,

   elementDeclaration,
   attListDeclaration,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEmptyXToken,
   ElementEndXToken,
   ElementStartXToken,
   SpaceXToken,
   GeneralEntityDeclarationXToken,
   ParameterEntityDeclarationXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,

   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   GENERAL_ENTITY_END_XTOKEN,
   GENERAL_ENTITY_START_XTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,

   CDATA_XTOKEN,
   CHARDATA_XTOKEN,
   COMMENT_XTOKEN,
   ELEMENT_EMPTY_XTOKEN,
   ELEMENT_END_XTOKEN,
   ELEMENT_START_XTOKEN,
   PROCESSING_INSTRUCTION_XTOKEN,

   SPACE_XTOKEN,

   NotationDeclarationXToken,
   ParameterEntityReferencePToken,
   TextXToken,
} from 'token';
import { AttListXToken, AttDefXToken, AttDefPToken, AttListPToken } from '../token/attListDeclaration';
import { AttributeXToken, AttributeValueXToken } from '../token/common/attribute';
import { ElementDeclaration, isXName, XNameList } from '../token/elementDeclaration';
import nameList, { XName } from '../token/contentspec/nameList';
import { Graph } from '../token/contentspec/nameListGraphTypes';
import { UnassignedType } from 'source/token/common/unassigned';
import { CHARREF_XTOKEN, PARAMETER_ENTITY_REFERENCE_XTOKEN, TEXTDECL_XTOKEN, XMLDECL_XTOKEN } from 'xToken';
import { GENERAL_ENTITY_REFERENCE_XTOKEN } from 'source/xToken/token/generalEntityReferenceXToken';

type XToken = {
   type: string;
   [name: string]: any;
};

type StreamCallback = () => void;

type ElementAttributes = {
   [elementName: string]: AttDefinitions;
};

type AttInfo = {
   def: AttDefXToken;
   externallyDeclared: boolean; // §2.9
}

type AttDefinitions = {
   tokens: Array<AttListXToken>;
   attributes: {
      [attrName: string]: AttInfo;
   };
}

type MixedChildrenMap = {
   [xName: string]: true;
};

type AnyContentDeclInfo = {
   type: 'ANY_CONTENT';
   token: ElementDeclaration;
}

type EmptyContentDeclInfo = {
   type: 'EMPTY_CONTENT';
   token: ElementDeclaration;
}

type MixedContentDeclInfo = {
   type: 'MIXED_CONTENT';
   token: ElementDeclaration;
   children: MixedChildrenMap;
}

type ElementContentDeclInfo = {
   type: 'ELEMENT_CONTENT';
   externallyDeclared: boolean; // §2.9
   token: ElementDeclaration;
   graph: Graph;
}

type ElementDeclInfo = AnyContentDeclInfo | EmptyContentDeclInfo | MixedContentDeclInfo | ElementContentDeclInfo;
type ContentContext = {
   declInfo: ElementDeclInfo;
   atElementContentStart: boolean; // consider extracting these into a sub-object
   lastElementContentValue: string;
   elementContentEntityRefStack: Array<string>;
   stateId: number;
}

type IDMap = {
   [idValue: string]: {
      token: ElementStartXToken | ElementEmptyXToken;
      attrName: string;
   };
};

type AttributeMap = { [name: string]: AttributeXToken };

type EntityInfo = {
   token: GeneralEntityDeclarationXToken | ParameterEntityDeclarationXToken;
   externallyDeclared: boolean; // §2.9
}

type EntityInfoMap = {
   [entityName: string]: EntityInfo;
}

const PROTECTED_ENTITIES = [ 'amp', 'lt', 'gt', 'apos', 'quot' ];

function getAttributeValueText(attribute: any): string {
   const rawValue = attribute.value;
   let newValue = '';

   rawValue.forEach((value: any) => { // typeHack
      if (isTextXToken(value) || value.type === CHARDATA_XTOKEN) {
         newValue += value.text;
      }
   });

   return newValue;
}

class CheckXTokenValidStream extends Transform {
   private paramEntitiesSeen: { [name: string]: any } = {}; // ick
   private generalEntitiesSeen: { [name: string]: any } = {};
   private entityInfo: EntityInfoMap = {};
   private docType: XToken | void;
   private notations: { [name: string]: XToken };
   private attrDefsByElementName: ElementAttributes;
   private elementDeclarations: { [name: string]: ElementDeclInfo };
   private contentStack: Array<ContentContext>;
   private currentContext: ContentContext | void;
   private idValues: IDMap;
   private unanchoredIDRefs: IDMap;
   private confVer: ConformanceVersion = new ConformanceVersion();
   private _seenRoot = false;
   private standalone = false;
   private externalDeclarations = false;
   private inInternalSubset = false;
   private internalEntityDepth = 0;

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
      this.unanchoredIDRefs = {};
   }

   /*
    * §2.9 Validity constraint: Standalone Document Declaration
    * The standalone document declaration must have the value "no" if any external markup
    * declarations contain declarations of:
    * - entities (other than amp, lt, gt, apos, quot), if references to those entities
    *   appear in the document, or ...
    *
    * Translation: If this was marked as standalone="yes", and we find an entity reference
    * where the referenced entity was declared "externally", then it is an error.
    */
   private isInvalidEntityReference(item: GeneralEntityStartXToken | ParameterEntityStartXToken | string): boolean {
      const entityName = typeof item === 'string' ? item : item.name;
      const entityInfo = this.entityInfo[entityName];
      const isExternallyDeclared = entityInfo && entityInfo.externallyDeclared;
      const isException = PROTECTED_ENTITIES.indexOf(entityName) !== -1;

      return this.standalone && isExternallyDeclared && !isException;
   }

   /*
    * §3.3.3: Attribute value normalization.
    * This should be done whether or not we are validating.
    */
   normalizeAttributeValue(attribute: any, attInfo: AttInfo | void, elName: string, pToken: any): any { // typeHack
      const attrDef: AttDefXToken | void = attInfo ? attInfo.def : undefined;
      const externallyDeclared = attInfo ? attInfo.externallyDeclared : false;
      const isCData = !attrDef || attrDef.type === 'CDATA';
      let prevHadTrailingSpace = true; // consider the start to already be space terminated
      let prevPiece: { text: string } | void;
      const newValue = [];
      let cDataDifference = false;

      for (let index = 0; index < attribute.value.length; index++) {
         const piece = attribute.value[index];

         if (!isTextXToken(piece)) {
            newValue.push(piece);
            continue;
         }

         let str = piece.text;
         const cDataText = str.replace(/[ \r\n\t]/g, ' ');

         if (isCData) {
            str = cDataText;
         } else {
            str = str.replace(/[ \r\n\t]+/g, ' ');

            if (prevHadTrailingSpace) {
               str = str.replace(/^ /, '');
            }

            prevHadTrailingSpace = str[str.length - 1] === ' ';
         }

         const newPiece = new TextXToken(str, piece.pToken as any); // typeHack
         newValue.push(newPiece);
         if (!isCData) {
            prevPiece = newPiece;
         }

         if (cDataText !== newPiece.text) {
            cDataDifference = true;
         }
      }

      if (prevHadTrailingSpace && prevPiece) {
         prevPiece!.text = prevPiece!.text.replace(/ $/, ''); // typeHack
         cDataDifference = true;
      }

      // §2.9 Validity constraint: Standalone Document Declaration
      // The standalone document declaration must have the value "no" if any external markup
      // declarations contain declarations of:
      // - attributes with tokenized types, where the attribute appears in the document
      //   with a value such that normalization will produce a different value from that
      //   which would be produced in the absence of the declaration
      if (this.standalone && cDataDifference && externallyDeclared) {
         this.pushValidityError(ValidityError.ID.ATTLISTDECL_TYPE_EXTERNAL_DECLARED,
            [ elName, attribute.name ], pToken);
      }

      return newValue;
   }

   private checkAttributeValueStandaloneability(attrName: string, value: AttributeValueXToken, pTokenOpen: any, elementAttribute: boolean) {
      let depth = 0;
      let invalidAt = -1;

      value.forEach((part) => {
         if (part instanceof GeneralEntityStartXToken || part instanceof ParameterEntityStartXToken) {
            if (invalidAt === -1 && this.isInvalidEntityReference(part)) {
               let errorId: string;
               invalidAt = depth;

               if (elementAttribute) {
                  if (part instanceof ParameterEntityStartXToken) {
                     errorId = ValidityError.ID.ATTRIBUTE_PARAMENTITY_EXTERNAL_DECLARED;
                  } else {
                     errorId = ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED;
                  }
               } else if (part instanceof ParameterEntityStartXToken) {
                  errorId = ValidityError.ID.ATTLISTDECL_PARAMENTITY_EXTERNAL_DECLARED;
               } else {
                  errorId = ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED;
               }

               this.pushValidityError(errorId, [ part.name, attrName ], pTokenOpen);
            }

            depth++;
         } else if (part instanceof GeneralEntityEndXToken || part instanceof ParameterEntityEndXToken) {
            depth--;

            if (invalidAt === depth) {
               invalidAt = -1;
            }
         }
      });
   }

   private pushValidityError(id: string, params: Array<string>, pos?: SToken | void, context?: SToken | void) {
      const error = new ValidityError(id, params, pos, context);

      this.push(error);
   }

   private pushWarning(id: string, params: Array<string>, pos?: SToken | void, context?: SToken | void) {
      const warning = new XmlWarning(id, params, pos, context);

      this.push(warning);
   }

   private checkContextValidity(xToken: XToken, sToken: SToken | void, context: ContentContext | void) {
      if (!context) {
         return;
      }
      const declInfo = context.declInfo;

      if (declInfo.type === 'EMPTY_CONTENT') {
         // §3.0.0 Validity Constraint: Element Valid
         //     1.0/1-2: 1. The declaration matches EMPTY and the element has no content.
         //     Other: The declaration matches EMPTY and the element has no content (not
         //        even entity references, comments, PIs or white space).
         //  [Note: we will never get here if an ElementEmpty was enccountered)
         if (!(xToken instanceof ElementEndXToken)) {
            this.pushValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
               [ declInfo.token.name ], sToken);
         }
      } else if (declInfo.type === 'ANY_CONTENT') {
         // §3.0.0 Validity Constraint: Element Valid
         //  1.0/1-2: 4. The declaration matches ANY, and the types of any child
         //       elements have been declared.
         //  1.0/3&1.1/1: 4. The declaration matches ANY, and the content (after
         //       replacing any entity references with their replacement text) consists
         //       of character data and child elements whose types have been declared.
         //  Other: (tolerant) The declaration matches ANY, and the content (after replacing any
         //       entity references with their replacement text) consists of character
         //       data , CDATA sections, comments, PIs and child elements whose types
         //       have been declared.
         const isRestrictiveVersion = (this.confVer.version === 1 && this.confVer.revision < 3);
         const isTolerantVersion = (this.confVer.version === 1 && this.confVer.revision > 3)
            || (this.confVer.version === 1.1 && this.confVer.revision > 1);
         const notAllowedParams = [ declInfo.token.name, this.confVer.version.toString(),
            this.confVer.revision.toString() ];

         switch (xToken.type) {
            case TEXTDECL_XTOKEN:
               // no problem here.
               break;
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               if (!this.elementDeclarations[xToken.name]) {
                  this.pushValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT,
                     [ declInfo.token.name, xToken.name ], sToken);
               }
               break;
            case ELEMENT_END_XTOKEN:
               // always ok
               break;
            case COMMENT_XTOKEN:
               // called out by valid/P43/ibm43v01.xml as OK
               // if (!isTolerantVersion) {
               //    this.pushValidityError(ValidityError.ID.ANY_XTRA_COMMENT, notAllowedParams, sToken);
               // }
               break;
            case CDATA_XTOKEN:
               // called out by valid/P43/ibm43v01.xml as OK
               // if (!isTolerantVersion) {
               //    this.pushValidityError(ValidityError.ID.ANY_XTRA_CDATA, notAllowedParams, sToken);
               // }
               break;
            case CHARREF_XTOKEN:
            case CHARDATA_XTOKEN:
            case GENERAL_ENTITY_REFERENCE_XTOKEN:
            case GENERAL_ENTITY_START_XTOKEN:
            case GENERAL_ENTITY_END_XTOKEN:
               if (isRestrictiveVersion) {
                  this.pushValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ declInfo.token.name ], sToken);
               }
               break;
            case PROCESSING_INSTRUCTION_XTOKEN:
               // called out by valid/P43/ibm43v01.xml as OK
               // if (!isTolerantVersion) {
               //    this.pushValidityError(ValidityError.ID.ANY_XTRA_PI, notAllowedParams, sToken);
               // }
               break;
            default:
               this.pushValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ declInfo.token.name ], sToken);
               break;
         }
      } else if (declInfo.type === 'MIXED_CONTENT') {
         // §3.0.0 Validity Constraint: Element Valid
         //  1.0/1-2: 3. The declaration matches Mixed and the content consists of
         //       character data and child elements whose types match names in the
         //       content model.
         //  1.0/3 & 1.1/1: 3. The declaration matches Mixed and the content (after
         //       replacing any entity references with their replacement text) consists
         //       of character data, comments, PIs and child elements whose types match
         //       names in the content model.
         //  Other: 3. The declaration matches Mixed, and the content (after
         //       replacing any entity references with their replacement text) consists
         //       of character data (including CDATA sections), comments, PIs and child
         //       elements whose types match names in the content model.
         const isRestrictiveVersion = (this.confVer.version === 1 && this.confVer.revision < 3);
         const isTolerantVersion = (this.confVer.version === 1 && this.confVer.revision > 3)
            || (this.confVer.version === 1.1 && this.confVer.revision > 1);

         switch (xToken.type) {
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               if (!declInfo.children[xToken.name]) {
                  this.pushValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                     [ declInfo.token.name, xToken.name ], sToken);
               }
               break;
            case CHARREF_XTOKEN:
            case CHARDATA_XTOKEN:
            case ELEMENT_END_XTOKEN:
               // always ok
               break;
            case CDATA_XTOKEN:
               // IBM valid/P19/ibm19v01.xml says that this isn't an error.
               // if (!isTolerantVersion) {
               //    this.pushValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
               //       [declInfo.token.name], sToken);
               // }
               break;
            case TEXTDECL_XTOKEN: // note this and things below we're not checking that they're well formed (e.g. in the right place)
            case COMMENT_XTOKEN:
            case GENERAL_ENTITY_REFERENCE_XTOKEN:
            case GENERAL_ENTITY_START_XTOKEN:
            case GENERAL_ENTITY_END_XTOKEN:
            case PROCESSING_INSTRUCTION_XTOKEN:
               if (isRestrictiveVersion) {
                  this.pushValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                     [ declInfo.token.name ], sToken);
               }
               break;
            default:
               this.pushValidityError(ValidityError.ID.MIXED_XTRA_MARKUP,
                  [ declInfo.token.name ], sToken);
               break;
         }
      } else { // 'ELEMENT_CONTENT'
         // §3.0.0 Validity Constraint: Element Valid
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
         //       belongs to the language generated by the regular expression in the content
         //       model, with optional white space, comments and PIs (i.e. markup
         //       matching production [27] Misc) between the start-tag and the first child
         //       element, between child elements, or between the last child element and
         //       the end-tag. Note that a CDATA section containing only white space or a
         //       reference to an entity whose replacement text is character references
         //       expanding to white space do not match the nonterminal S, and hence cannot
         //       appear in these positions; however, a reference to an internal entity with
         //       a literal value consisting of character references expanding to white
         //       space does match S, since its replacement text is the white space
         //       resulting from expansion of the character references.
         //  This implementation assumes that the intent was to allow comments and PI's
         //  along with S in the replacement text of entities, so allows this in 1.0/5 and 1.1/2
         const isNoSpaceAtEndsVersion = (this.confVer.version === 1 && this.confVer.revision === 1);
         const isSpaceAtEndsVersion = (this.confVer.version === 1 && this.confVer.revision === 2);
         const isOnlySInEntityVersion = (this.confVer.version === 1 && (this.confVer.revision > 2 && this.confVer.revision < 5))
            || (this.confVer.version === 1.1 && this.confVer.revision === 1);
         const isTolerantVersion = (this.confVer.version === 1 && this.confVer.revision >= 5)
            || (this.confVer.version === 1.1 && this.confVer.revision >= 2);

         const notAllowedParams = [ declInfo.token.name, this.confVer.version.toString(),
            this.confVer.revision.toString() ];

         const currentState = declInfo.graph.states[context.stateId];

         if (xToken.type === SPACE_XTOKEN) {
            if (isNoSpaceAtEndsVersion && context.atElementContentStart) {
               this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_SPACE, [], sToken);
            }
         } else {
            context.atElementContentStart = false;
         }

         switch (xToken.type) {
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               const destState = currentState.trans[xToken.name];

               if (!destState) {
                  this.pushValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT,
                     [ declInfo.token.name, xToken.name ], sToken);
               } else {
                  context.stateId = destState.stateId;
               }
               break;
            case ELEMENT_END_XTOKEN:
               if (currentState.done !== true) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_UNEXPECTED_END, [ declInfo.token.name,
                     Object.keys(currentState.trans).join(', ') ], sToken);
               }

               if (isNoSpaceAtEndsVersion && context.lastElementContentValue === SPACE_XTOKEN) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_SPACE, [], sToken);
               }
               break;
            case GENERAL_ENTITY_REFERENCE_XTOKEN:
            case GENERAL_ENTITY_START_XTOKEN:
            case GENERAL_ENTITY_END_XTOKEN:
               if (isNoSpaceAtEndsVersion || isSpaceAtEndsVersion) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, notAllowedParams, sToken);
               }

               if (xToken.type === GENERAL_ENTITY_START_XTOKEN) {
                  context.elementContentEntityRefStack.push(xToken.name);
               } else if (xToken.type === GENERAL_ENTITY_END_XTOKEN) {
                  context.elementContentEntityRefStack.pop(); // might be nice to validate that it matches
               }
               break;
            case SPACE_XTOKEN:
               // §2.9 Validity constraint: Standalone Document Declaration
               //    The standalone document declaration must have the value "no" if any external markup
               //    declarations contain declarations of:
               //       - element types with element content, if white space occurs directly within any instance of those types
               // Note: This is because in this circumstance, something parsing this as non-validated will not know
               // whether those spaces are content or throwaway S.

               if (this.standalone && declInfo.externallyDeclared) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_SPACE_EXTERNAL_DECLARED, [ declInfo.token.name ], sToken);
               }
               break;
            case PROCESSING_INSTRUCTION_XTOKEN:
               const piInEntity = context.elementContentEntityRefStack.length > 0;
               if ((!isOnlySInEntityVersion || (isOnlySInEntityVersion && piInEntity)) && !isTolerantVersion) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_PI, notAllowedParams, sToken);
               }
               break;
            case COMMENT_XTOKEN:
               const inEntity = context.elementContentEntityRefStack.length > 0;
               if ((!isOnlySInEntityVersion || (isOnlySInEntityVersion && inEntity)) && !isTolerantVersion) {
                  this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, notAllowedParams, sToken);
               }
               break;
            case TEXTDECL_XTOKEN:
               // We don't care if there is a TEXTDECL in here.
               break;
            default:
               this.pushValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, notAllowedParams, sToken);
               break;
         }

         // Keep track of the last thing we saw here, except for entity start and end markers, which are not "real".
         if (xToken.type !== GENERAL_ENTITY_START_XTOKEN && xToken.type !== GENERAL_ENTITY_END_XTOKEN) {
            context.lastElementContentValue = xToken.type;
         }
      }
   }

   _transform(xToken: XToken, _: string, done: StreamCallback) {
      const pToken = (xToken.pToken || {}).open;
      const context = this.currentContext;

      if (xToken.type !== ERROR_TYPE) {
         /*
          * §3.2.1
          *    An element type has **element content** when elements of that type
          *    must contain only child elements (no character data), optionally
          *    separated by white space (characters matching the nonterminal S)
          * Because of this we convert any CHARDATA types which contain only whitespace here into spaces
          */
         if (xToken.type === CHARDATA_XTOKEN && context && context.declInfo.type === 'ELEMENT_CONTENT') {
            if (isSpace(xToken.text, this.confVer.version)) {
               xToken = new SpaceXToken(xToken.text, xToken.pToken);
            }
         }

         this.checkContextValidity(xToken, pToken, context);
      }

      if (xToken.type === EXTERNAL_SUBSET_START_TOKEN) {
         this.externalDeclarations = true;
      }

      if (xToken.type === EXTERNAL_SUBSET_END_TOKEN) {
         this.externalDeclarations = false;
      }

      if (xToken.type === INTERNAL_SUBSET_START_TOKEN) {
         this.inInternalSubset = true;
      }

      if (xToken.type === INTERNAL_SUBSET_END_TOKEN) {
         this.inInternalSubset = false;
      }

      if (xToken.type === XMLDECL_XTOKEN) {
         this.standalone = xToken.standalone;
      }

      /*
       * §4.1: Validity Constraint: Entity Declared
       *    In a document with an external subset or external parameter entities
       *    with "standalone='no'", the Name given in the entity reference must
       *    match that in an entity declaration.
       */
      if (xToken.type === GENERAL_ENTITY_REFERENCE_XTOKEN) {
         this.pushValidityError(ValidityError.ID.GEREF_UNDEFINED, [ xToken.name ], pToken);
      } else if (xToken.type === PARAMETER_ENTITY_REFERENCE_XTOKEN) {
         this.pushValidityError(ValidityError.ID.PEREF_UNDEFINED, [ xToken.name ], pToken);
      }

      if (xToken instanceof NotationDeclarationXToken) {
         this.validateNotationDeclaration(xToken);
      } else if (xToken instanceof attListDeclaration.XToken) {
         this.validateAttListDecl(xToken);
      } else if (xToken instanceof GeneralEntityDeclarationXToken || xToken instanceof ParameterEntityDeclarationXToken) {
         this.entityInfo[xToken.name] = {
            token: xToken,
            externallyDeclared: this.externalDeclarations,
         };
         this.checkEntityDeclaration(xToken);
      } else if (xToken instanceof GeneralEntityStartXToken) {
         if (this.isInvalidEntityReference(xToken)) {
            this.pushValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               [ xToken.name ], pToken);
         }
      } else if (xToken instanceof ParameterEntityStartXToken) {
         if (this.isInvalidEntityReference(xToken)) {
            this.pushValidityError(ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               [ xToken.name ], pToken);
         }

         if (this.inInternalSubset) {
            this.internalEntityDepth++;
            this.externalDeclarations = true;
         }
      } else if (xToken instanceof ParameterEntityEndXToken) {
         if (this.inInternalSubset) {
            this.internalEntityDepth--;

            if (this.internalEntityDepth === 0) {
               this.externalDeclarations = false;
            }
         }
      } else if (xToken instanceof elementDeclaration.XToken) {
         this.validateElementDecl(xToken);
      } else if (xToken instanceof DocTypeStartXToken) {
         this.docType = xToken;
      } else if (xToken instanceof ElementStartXToken || xToken instanceof ElementEmptyXToken) {
         if (!this._seenRoot) {
            if (this.docType && xToken.name !== this.docType.name) {
               this.pushValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this.docType.name, xToken.name ],
                  this.docType.pToken && this.docType.pToken.open);
            }
            this._seenRoot = true;
         }

         if (xToken instanceof ElementStartXToken) {
            if (this.elementDeclarations[xToken.name]) {
               this.currentContext = {
                  declInfo: this.elementDeclarations[xToken.name],
                  stateId: 0,
                  atElementContentStart: true,
                  lastElementContentValue: '',
                  elementContentEntityRefStack: [],
               };
            } else {
               this.currentContext = {
                  declInfo: {
                     token: new ElementDeclaration(xToken.name, 'ANY', undefined),
                     type: 'ANY_CONTENT',
                  },
                  stateId: 0,
                  atElementContentStart: true,
                  lastElementContentValue: '',
                  elementContentEntityRefStack: [],
               };
            }

            if (this.currentContext) {
               this.contentStack.push(this.currentContext);
            }

         }

         this.validateElementStart(xToken);
      } else if (xToken instanceof ElementEndXToken) {
         this.contentStack.pop();
         this.currentContext = this.contentStack[this.contentStack.length - 1];

         if (this.contentStack.length === 0) {
            this.validateDocumentEnd();
         }
      } else if (xToken instanceof DocTypeEndXToken) {
         this.validateDTD();
      }

      if (xToken.type === CONFORMANCE_VERSION) {
         this.confVer = xToken as any;
      }

      this.push(xToken);

      done();
   }

   private checkEntityDeclaration(xToken: GeneralEntityDeclarationXToken | ParameterEntityDeclarationXToken) {
      const name = xToken.name;
      const seen = xToken instanceof ParameterEntityDeclarationXToken ? this.paramEntitiesSeen : this.generalEntitiesSeen;

      // §4.2 If the same entity is declared more than once, ... at user option,
      // an XML processor may issue a warning if entities are declared multiple times.
      if (seen[name]) {
         const warning = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, [ name ]);
         this.push(warning);
      }

      seen[name] = xToken;
   }

   private validateNotationDeclaration(notationDecl: NotationDeclarationXToken) {
      if (this.notations[notationDecl.name]) {
         // §4.7 Validity constraint: Unique Notation Name
         // A given Name must not be declared in more than one notation declaration.
         const pToken = notationDecl.pToken ? notationDecl.pToken.open : undefined;
         const errorOnDuplicate = this.confVer.version === 1 && this.confVer.revision >= 2 || this.confVer.version === 1.1;

         if (errorOnDuplicate) {
            this.pushValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ notationDecl.name ], pToken);
         }
         return;
      }

      this.notations[notationDecl.name] = notationDecl;
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
            attrDefs.attributes[attDef.name] = {
               def: attDef,
               externallyDeclared: this.externalDeclarations,
            };
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
      const oneDotZeroRev3OrHigher = this.confVer.version === 1.1 || (this.confVer.version === 1 && this.confVer.revision > 2);
      const defaultText = getAttributeValueText(attDef);
      const hasDefault = attDef.value.length > 0;

      // §2.10: concerning xml:space:
      //    it must be given as an enumerated type whose values are one or both of "default"
      //    and "preserve". ... It is an error for other values to be specified; the XML
      //    processor may report the error or may recover by ignoring the attribute
      //    specification or by reporting the (erroneous) value to the application.
      //    Applications may ignore or reject erroneous values.
      if (attDef.name.toLowerCase() === 'xml:space') {
         if (attDef.name !== 'xml:space') {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_CASE,
               [ attList.elementName, attDef.name ], pToken.open);
         }

         if (attDef.type !== 'ENUMERATION' || !attDef.enumeration) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
               [ attList.elementName ], pToken.open);
         } else if (attDef.enumeration.length === 0) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_SPACE_MISSING_ENUMRATION,
               [ attList.elementName ], pToken.open);
         } else {
            for (const element of attDef.enumeration) {
               if (element !== 'preserve' && element !== 'default') {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                     [ attList.elementName, element ], pToken.open);
               }
            }
         }
      }

      // §2.9
      this.checkAttributeValueStandaloneability(attDef.name, attDef.value, pToken.open, false);

      // §4.1: Validity Constraint: Entity Declared
      //    ...Similarly, the declaration of a general entity must precede any attribute-list
      //    declaration containing a default value with a direct or indirect reference
      //    to that general entity.
      this.checkAttributeValueForUnexpandedReferences(attDef.value, ValidityError.ID.ATTLISTDECL_REFERENCE_UNDEFINED, attDef.name, attList.elementName, pToken.open);

      if (type === 'ID') {
         // §3.3.1: Validity constraint: ID Attribute Default
         //    An ID attribute must have a declared default of #IMPLIED or #REQUIRED.
         if (defaultType !== '#IMPLIED' && defaultType !== '#REQUIRED') {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ attList.elementName, attDef.name, defaultType ], pToken.open);
         }

         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    It doesn't make a lot of sense for an ID to have a default value, but the spec doesn't
         //    forbid this. We allow it, and follow the spirit of this validity constraint to
         //    require that value be a legitimate name
         if (hasDefault && !isName(defaultText, this.confVer.version, this.confVer.revision)) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_ID_DEFAULT,
               [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }
      } else if (type === 'IDREF' || type === 'ENTITY') {

         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type IDREF or ENTITY must match the Name production;
         if (hasDefault && !isName(defaultText, this.confVer.version, this.confVer.revision)) {
            const code = type === 'IDREF' ? ValidityError.ID.ATTLISTDECL_BAD_IDREF_DEFAULT
               : ValidityError.ID.ATTLISTDECL_BAD_ENTITY_DEFAULT;

            this.pushValidityError(code, [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }

         // §2.9
         if (type === 'ENTITY' && this.isInvalidEntityReference(defaultText)) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               [ defaultText, attDef.name ], pToken.open);
         }
      } else if (type === 'IDREFS' || type === 'ENTITIES') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type IDREFS or ENTITIES must match the Names production;
         if (hasDefault) {
            const names = defaultText.split(/ +/);
            const badNames = [];

            for (const name of names) {
               if (!isName(name, this.confVer.version, this.confVer.revision)) {
                  badNames.push(name);
               }

               // §2.9
               if (type === 'ENTITIES' && this.isInvalidEntityReference(name)) {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
                     [ name, attDef.name ], pToken.open);
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
         if (hasDefault && !isNmToken(defaultText, this.confVer.version, this.confVer.revision)) {
            this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKEN_DEFAULT,
               [ attList.elementName, attDef.name, defaultText ], pToken.open);
         }
      } else if (type === 'NMTOKENS') {
         // §3.3.2 Validity constraint: Attribute Default Value Syntactically Correct
         //    The declared default value must meet the syntactic constraints of the declared attribute type.
         //    ...of type NMTOKENS must match the Nmtokens production;
         if (hasDefault) {
            const names = defaultText.split(/ +/).map(name => name.trim()).filter(name => name !== '');

            const badNames = [];

            for (const name of names) {
               if (!isNmToken(name, this.confVer.version, this.confVer.revision)) {
                  badNames.push(name);
               }
            }

            if (badNames.length > 0) {
               this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKENS_DEFAULT,
                  [ attList.elementName, attDef.name, badNames.join(', ') ], pToken.open);
            }
         }
      } else if (type === 'NOTATION') {
         const notationNames: Array<string> = attDef.enumeration || [];

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

   private checkAttributeValueForUnexpandedReferences(value: AttributeValueXToken, errorId: string, attrName: string, elementName: string, context?: SToken) {
      for (const element of value) {
         if (element.type === GENERAL_ENTITY_REFERENCE_XTOKEN || element.type === PARAMETER_ENTITY_REFERENCE_XTOKEN) {
            this.pushValidityError(errorId, [ (element as any).name, attrName, elementName ], context);
         }
      }
   }

   private findDuplicateNamesInEnumeration(names: Array<string>): Array<string> {
      const nameCounts: { [name: string]: number } = {};
      const duplicates: Array<string> = [];

      for (let index = 0; index < names.length; index++) {
         const notationName = names[index];

         nameCounts[notationName] = nameCounts[notationName] || 0;
         nameCounts[notationName]++;
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

      // Validity Constraint: §3.2.0: Validity constraint: Unique Element Type Declaration
      //    An element type must not be declared more than once.
      if (this.elementDeclarations[elDecl.name]) {
         this.pushValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
            [ elDecl.name ], openSToken);
         return;
      }

      if (elDecl.contentSpecType === 'EMPTY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: 'EMPTY_CONTENT',
         };
      } else if (elDecl.contentSpecType === 'ANY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: 'ANY_CONTENT',
         };
      } else {
         const children: XNameList = elDecl.children || {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         };

         // §3.2.0: At user option, an XML processor may issue a warning when a declaration mentions an
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
               type: 'MIXED_CONTENT',
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
            const graph = nameList.graphFromNameList(children);

            //
            // §3.2.1
            // For compatibility, it is an error if an element in the document can
            // match more than one occurrence of an element type in the content
            // model. For more information, see "E. Deterministic Content Models".
            //
            const cases: Array<string> = [];

            Object.keys(graph.states).forEach((id) => {
               const state = graph.states[Number(id)];

               Object.keys(state.trans).forEach((transName) => {
                  if (state.trans[transName].ref.indexOf(',') != -1) {
                     cases.push(`${transName} (${state.trans[transName].ref})`);
                  }
               });
            });

            if (cases.length > 0) {
               const wfe = new WellFormedError(WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
                  [ cases.join(',') ], openSToken, undefined);

               this.push(wfe);
            }

            this.elementDeclarations[elDecl.name] = {
               token: elDecl,
               type: 'ELEMENT_CONTENT',
               externallyDeclared: this.externalDeclarations, // §2.9
               graph,
            };
         }
      }

      this._examineUnassigned(elDecl); //
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
      const unassignedArray = pToken.peRefPlus || [];
      let insideContentSpec = !!pToken.children;
      let entityDepth = 0;
      let parenDepth = 0;
      let sawNonWhite = false;
      let endedWithConnector = false;
      let topEntityRef: ParameterEntityReferencePToken | void;

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
      }
   }

   /*
    * Does all checks that can only be done once we have the whole DTD processed
    */
   private validateDTD() {
      const oneDotZeroRev2OrHigher = this.confVer.version === 1.1 || (this.confVer.version === 1 && this.confVer.revision > 1);

      Object.keys(this.attrDefsByElementName).forEach((elementType: string) => {
         const attList = this.attrDefsByElementName[elementType];
         let idCount = 0;
         let notationCount = 0;

         Object.keys(attList.attributes).forEach((name) => {
            const attrDef = attList.attributes[name].def;

            // §3.3.1: Validity constraint: One ID per Element Type
            //    An element type must not have more than one ID attribute specified.
            if (attrDef.type === 'ID') {
               idCount++;

               if (idCount > 1) {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID, [ elementType, attrDef.name ], undefined);

               }

            } else if (attrDef.type === 'NOTATION') {
               // §3.3.1: Validity constraint: Notation Attributes
               //    ...all notation names in the declaration must be declared.
               // However, it is interesting to note that they do not need to have been dceclared
               // before the ATTLIST.  See valid-sa-076
               const notationNames: Array<string> = attrDef.enumeration || [];
               const attDecl = attList.tokens.find(token => {
                  return !!token.attDefs.find(def => {
                     return def === attrDef;
                  });
               });
               const pToken = attDecl?.pToken ?? { open: undefined };

               for (let index = 0; index < notationNames.length; index++) {
                  const notationName = notationNames[index];
                  const notationDecl = this.notations[notationName];

                  if (!notationDecl) {
                     this.pushValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION,
                        [ elementType, attrDef.name, notationName ], pToken.open);
                  }
               }

               // §3.3.1: (in 1.0/2+) Validity constraint: One Notation Per Element Type
               //    An element type must not have more than one NOTATION attribute specified.
               notationCount++;

               if (oneDotZeroRev2OrHigher && notationCount > 1) {
                  this.pushValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                     [ elementType, attrDef.name ], undefined);
               }

               // §3.3.1 (1.0/2+): Validity constraint: No Notation on Empty Element
               //    For compatibility, an attribute of type NOTATION must
               //    not be declared on an element declared EMPTY.
               if (oneDotZeroRev2OrHigher) {
                  const elementDecl = this.elementDeclarations[elementType];

                  if (elementDecl && elementDecl.type === 'EMPTY_CONTENT') {
                     this.pushValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                        [ elementType, attrDef.name ], undefined);
                  }
               }
            }
         });
      });

      Object.values(this.generalEntitiesSeen).forEach((genEntity: GeneralEntityDeclarationXToken) => {
         if (genEntity.notationDataName) {
            const pTokenOpen = genEntity.pToken ? genEntity.pToken.open : undefined;
            const nDataName = genEntity.notationDataName;

            // §4.2.2: Validity Constraint: Notation Declared
            // The Name must match the declared name of a notation.
            if (!this.notations[nDataName]) {
               this.pushValidityError(ValidityError.ID.ENTITYDECL_UNDECLARED_NOTATION,
                  [ genEntity.name, nDataName ], pTokenOpen);
            }
         }
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

   private validateElementStart(elStart: ElementStartXToken | ElementEmptyXToken) {
      const elemAttrDef = this.attrDefsByElementName[elStart.name];
      const elementDecl = this.elementDeclarations[elStart.name];
      const attributes = elStart.attributes;
      const pTokenOpen = elStart.pToken && elStart.pToken.open;
      const attributesByName: AttributeMap = {};
      const elName = elementDecl ? elementDecl.token.name : '';

      // §3.3.3: Normalization
      for (let index = 0; index < attributes.length; index++) {
         const attrName = attributes[index].name;
         const attrInfo = elemAttrDef && elemAttrDef.attributes[attrName];
         const attrDef = attrInfo && attrInfo.def;

         attributes[index].value = this.normalizeAttributeValue(attributes[index], attrInfo,
            elName, pTokenOpen);

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
         for (let index = 0; index < attDefNames.length; index++) {
            const attDefName = attDefNames[index];
            const attrInfo = elemAttrDef.attributes[attDefName];
            const attDef = attrInfo.def;
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

                  //
                  // §2.9 Validity constraint: Standalone Document Declaration
                  // The standalone document declaration must have the value "no" if any external markup
                  // declarations contain declarations of:
                  // - attributes with default values, if elements to which these attributes apply appear
                  // in the document without specifications of values for these attributes, ...
                  //
                  // Translation: If this was marked as standalone="yes", and we find an element without
                  // an attribute that was declared as having a default value, and that declaration was
                  // an external declaration, then we have a validity error. (We can't just check this
                  // at declaration time, since if it isn't used it is not an error).
                  //
                  if (this.standalone && attrInfo.externallyDeclared) {
                     this.pushValidityError(ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
                        [ elStart.name, attDefName ], pTokenOpen);
                  }

                  attributesByName[attDefName] = newAttribute;
                  (attributes as any).push(newAttribute); //typeHack
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
            const attInfo = elemAttrDef.attributes[attrName];
            const attrDef = attInfo && attInfo.def;
            const attrText = getAttributeValueText(attributes[index]);

            attributeNames.push(attrName); // for use further below.

            if (!attrDef) {
               this.pushValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
                  [ elStart.name, attrName ], pTokenOpen);
            } else if (attrDef.type === 'ID') {
               // §3.3.1: Validity constraint: ID
               //    Values of type ID must match the Name production.  ...
               if (!isName(attrText, this.confVer.version, this.confVer.revision)) {
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
                  };
               }

               // §3.3.1: Validiatity Constraint: IDREF
               //    ... each Name must match the value of an ID attribute on some element in the
               //    XML document; i.e. IDREF values must match the value of some ID attribute.
               if (this.unanchoredIDRefs[attrText]) {
                  delete this.unanchoredIDRefs[attrText];
               }
            } else if (attrDef.type === 'IDREF' || attrDef.type === 'IDREFS') {
               const names = attrDef.type === 'IDREF' ? [ attrText ] : attrText.split(/ +/);// Can't happen once normalization happens
               const badNames = [];

               // §3.3.1: Validity Constraint: IDREF
               //    Values of type IDREF must match the Name production, and
               //    values of type IDREFS must match Names...
               for (let index = 0; index < names.length; index++) {
                  const idRef = names[index];
                  if (!isName(idRef, this.confVer.version, this.confVer.revision)) {
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
               const names = attrDef.type === 'ENTITY' ? [ attrText ] : attrText.split(/ +/);// Can't happen once normalization happens
               const badNames = [];

               // §3.3.1: Validity Constraint: Entity Name
               //    Values of type ENTITY must match the Name production,
               //    values of type ENTITIES must match Names;
               for (let index = 0; index < names.length; index++) {
                  if (!isName(names[index], this.confVer.version, this.confVer.revision)) {
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
               // (Also §4.4 row three of table, and mentioned in §4.1.0 Well-formedness constraint: Parsed Entity)
               for (let index = 0; index < names.length; index++) {
                  const token = this.generalEntitiesSeen[names[index]];
                  if (!token) {
                     undeclared.push(names[index]);
                  } else if (!token.notationDataName) {
                     parsed.push(names[index]);
                  }

                  if (this.isInvalidEntityReference(names[index])) {
                     this.pushValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED, // @@ rename
                        [ names[index], attrName ], pTokenOpen);
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
               const names = attrDef.type === 'NMTOKEN' ? [ attrText ] : attrText.split(/ +/).map(name => name.trim()).filter(name => name !== '');
               const badNames = [];

               // §3.3.1: Validity Constraint: Name Token
               //    Values of type NMTOKEN must match the Nmtoken production;
               //    values of type NMTOKENS must match Nmtokens.
               for (let index = 0; index < names.length; index++) {
                  if (!isNmToken(names[index], this.confVer.version, this.confVer.revision)) {
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
               const declaredNames = attrDef.enumeration || [];

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

      for (const attribute of attributes) {
         // §2.9
         this.checkAttributeValueStandaloneability(attribute.name, attribute.value, pTokenOpen, true);
         // §4.1: Validity Constraint: Entity Declared
         //    ...the Name given in the entity reference must match that in an entity declaration...
         this.checkAttributeValueForUnexpandedReferences(attribute.value, ValidityError.ID.ELEMENTSTART_REFERENCE_UNDEFINED,
            attribute.name, elStart.name, pTokenOpen);
      }

      if (!elementDecl) {
         return;
      }

      // Interoperability: §3.1: For interoperability, the empty-element tag should be
      //    used, and should only be used, for elements which are declared EMPTY.
      const tokenIsEmptyType = elStart instanceof ElementEmptyXToken;
      const declarationIsEmpty = elementDecl.type === 'EMPTY_CONTENT';
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
}

export default CheckXTokenValidStream;
