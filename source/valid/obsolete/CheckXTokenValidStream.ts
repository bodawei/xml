/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import {
   ConformanceVersion,
   isSpace,
   ERROR_TYPE,
   warning,
   WarningToken,
   CONFORMANCE_VERSION,
} from 'basic';
import { AttListDeclarationPToken } from 'pToken';
import { SToken } from 'sToken';
import {
   CDATA_SECTION_XTOKEN,
   CHARDATA_XTOKEN,
   CHARREF_XTOKEN,
   COMMENT_XTOKEN,
   ELEMENT_EMPTY_XTOKEN,
   ELEMENT_END_XTOKEN,
   ELEMENT_START_XTOKEN,
   GENERAL_ENTITY_REFERENCE_XTOKEN,
   GENERAL_ENTITY_END_XTOKEN,
   GENERAL_ENTITY_START_XTOKEN,
   PARAMETER_ENTITY_REFERENCE_XTOKEN,
   PROCESSING_INSTRUCTION_XTOKEN,
   SPACE_XTOKEN,
   TEXTDECL_XTOKEN,
   XMLDECL_XTOKEN,
   AttListDeclarationXToken,
   AttDefinitionXToken,
   ContentModelX,
   CpRepeat,
   CpType,
   DocTypeStartXToken,
   ElementDeclarationXToken,
   ElementEmptyXToken,
   ElementEndXToken,
   ElementStartXToken,
   GeneralEntityDeclarationXToken,
   GeneralEntityStartXToken,
   isContentNameX,
   NotationDeclarationXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,
   SpaceXToken,
   ParameterEntityDeclarationXToken,
   isTextXToken,
   TextXToken,
   PARAMETER_ENTITY_START_XTOKEN,
   PARAMETER_ENTITY_END_XTOKEN,
   NOTATION_DECLARATION_XTOKEN,
} from 'xToken';
import { ValidityError } from 'valid';

import {
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
} from 'token';

import { ContentSpecType } from 'xToken';
import { LiteralValueX } from 'xToken';

interface XToken {
   type: string;
   [name: string]: any;
}

type StreamCallback = () => void;

interface ElementAttributes {
   [elementName: string]: AttDefinitions;
}

interface AttInfo {
   def: AttDefinitionXToken;
   externallyDeclared: boolean; // §2.9
}

interface AttDefinitions {
   tokens: Array<AttListDeclarationXToken>;
   attributes: {
      [attrName: string]: AttInfo;
   };
}

interface AnyContentDeclInfo {
   type: 'ANY_CONTENT';
   token: ElementDeclarationXToken;
}

interface EmptyContentDeclInfo {
   type: 'EMPTY_CONTENT';
   token: ElementDeclarationXToken;
}

interface MixedContentDeclInfo {
   type: 'MIXED_CONTENT';
   token: ElementDeclarationXToken;
}

interface ElementContentDeclInfo {
   type: 'ELEMENT_CONTENT';
   externallyDeclared: boolean; // §2.9
   token: ElementDeclarationXToken;
}

type ElementDeclInfo =
   | AnyContentDeclInfo
   | EmptyContentDeclInfo
   | MixedContentDeclInfo
   | ElementContentDeclInfo;
interface ContentContext {
   declInfo: ElementDeclInfo;
   atElementContentStart: boolean; // consider extracting these into a sub-object
   lastElementContentValue: string;
   elementContentEntityRefStack: Array<string>;
   stateId: number;
}
interface EntityInfo {
   token: GeneralEntityDeclarationXToken | ParameterEntityDeclarationXToken;
   externallyDeclared: boolean; // §2.9
}

interface EntityInfoMap {
   [entityName: string]: EntityInfo;
}

const PROTECTED_ENTITIES = ['amp', 'lt', 'gt', 'apos', 'quot'];

function getAttributeValueText(attribute: any): string {
   const rawValue = attribute.value;
   let newValue = '';

   rawValue.forEach((value: any) => {
      // typeHack
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

   private docType: XToken | undefined;

   private notations: { [name: string]: XToken };

   private attrDefsByElementName: ElementAttributes;

   private elementDeclarations: { [name: string]: ElementDeclInfo };

   private contentStack: Array<ContentContext>;

   private currentContext: ContentContext | undefined;

   private confVer: ConformanceVersion = new ConformanceVersion();

   private standalone = false;

   private externalDeclarations = false;

   private inInternalSubset = false;

   private internalEntityDepth = 0; // Istanbul is confused by node transpilation

   /* istanbul ignore next */ constructor() {
      super({
         objectMode: true,
      });

      this.docType = undefined;
      this.notations = {};
      this.attrDefsByElementName = {};
      this.elementDeclarations = {};
      this.contentStack = [];
      this.currentContext = undefined;
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
   private isInvalidEntityReference(
      item: GeneralEntityStartXToken | ParameterEntityStartXToken | string,
   ): boolean {
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
   normalizeAttributeValue(attribute: any, attInfo: AttInfo | undefined): any {
      // typeHack
      const attrDef: AttDefinitionXToken | undefined = attInfo ? attInfo.def : undefined;
      const isCData = !attrDef || attrDef.type === 'CDATA';
      let prevHadTrailingSpace = true; // consider the start to already be space terminated
      let prevPiece: { text: string } | undefined;
      const newValue = [];

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

            prevHadTrailingSpace = str.endsWith(' ');
         }

         const newPiece = new TextXToken(str);
         newValue.push(newPiece);
         if (!isCData) {
            prevPiece = newPiece;
         }
      }

      if (prevHadTrailingSpace && prevPiece) {
         prevPiece.text = prevPiece.text.replace(/ $/, ''); // typeHack
      }

      return newValue;
   }

   private checkAttributeValueStandaloneability(
      attrName: string,
      value: LiteralValueX,
      pTokenOpen: any,
      elementAttribute: boolean,
   ) {
      let depth = 0;
      let invalidAt = -1;

      value.forEach((part) => {
         if (
            part.type === GENERAL_ENTITY_START_XTOKEN ||
            part.type === PARAMETER_ENTITY_START_XTOKEN
         ) {
            if (invalidAt === -1 && this.isInvalidEntityReference(part)) {
               let errorId: string;
               invalidAt = depth;

               if (elementAttribute) {
                  if (part.type === PARAMETER_ENTITY_START_XTOKEN) {
                     errorId = ValidityError.ID.ATTRIBUTE_PARAMENTITY_EXTERNAL_DECLARED;
                  } else {
                     errorId = ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED;
                  }
               } else if (part.type === PARAMETER_ENTITY_START_XTOKEN) {
                  errorId = ValidityError.ID.ATTLISTDECL_PARAMENTITY_EXTERNAL_DECLARED;
               } else {
                  errorId = ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED;
               }

               this.pushValidityError(errorId, [part.name, attrName], pTokenOpen);
            }

            depth++;
         } else if (
            part.type === GENERAL_ENTITY_END_XTOKEN ||
            part.type === PARAMETER_ENTITY_END_XTOKEN
         ) {
            depth--;

            if (invalidAt === depth) {
               invalidAt = -1;
            }
         }
      });
   }

   private pushValidityError(
      id: string,
      params: Array<string>,
      pos?: SToken | undefined,
      context?: SToken | undefined,
   ) {
      const error = new ValidityError(id, params, pos, context);

      this.push(error);
   }

   private pushWarning(
      id: string,
      params: Array<string>,
      pos?: SToken | undefined,
      context?: SToken | undefined,
   ) {
      const warning = new WarningToken(id, params, pos, context);

      this.push(warning);
   }

   private checkContextValidity(
      xToken: XToken,
      sToken: SToken | undefined,
      context: ContentContext | undefined,
   ) {
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
         if (!(xToken.type === ELEMENT_END_XTOKEN)) {
            this.pushValidityError(
               ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
               [declInfo.token.name],
               sToken,
            );
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
         const isRestrictiveVersion = this.confVer.version === 1 && this.confVer.edition < 3;
         const isTolerantVersion =
            (this.confVer.version === 1 && this.confVer.edition > 3) ||
            (this.confVer.version === 1.1 && this.confVer.edition > 1);
         const notAllowedParams = [
            declInfo.token.name,
            this.confVer.version.toString(),
            this.confVer.edition.toString(),
         ];

         switch (xToken.type) {
            case TEXTDECL_XTOKEN:
               // no problem here.
               break;
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               // dead
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
            case CDATA_SECTION_XTOKEN:
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
                  this.pushValidityError(
                     ValidityError.ID.ANY_XTRA_MARKUP,
                     [declInfo.token.name],
                     sToken,
                  );
               }
               break;
            case PROCESSING_INSTRUCTION_XTOKEN:
               // called out by valid/P43/ibm43v01.xml as OK
               // if (!isTolerantVersion) {
               //    this.pushValidityError(ValidityError.ID.ANY_XTRA_PI, notAllowedParams, sToken);
               // }
               break;
            default:
               this.pushValidityError(
                  ValidityError.ID.ANY_XTRA_MARKUP,
                  [declInfo.token.name],
                  sToken,
               );
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
         const isRestrictiveVersion = this.confVer.version === 1 && this.confVer.edition < 3;
         const isTolerantVersion =
            (this.confVer.version === 1 && this.confVer.edition > 3) ||
            (this.confVer.version === 1.1 && this.confVer.edition > 1);

         switch (xToken.type) {
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               // dead
               break;
            case CHARREF_XTOKEN:
            case CHARDATA_XTOKEN:
            case ELEMENT_END_XTOKEN:
               // always ok
               break;
            case CDATA_SECTION_XTOKEN:
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
                  this.pushValidityError(
                     ValidityError.ID.MIXED_XTRA_MARKUP,
                     [declInfo.token.name],
                     sToken,
                  );
               }
               break;
            default:
               this.pushValidityError(
                  ValidityError.ID.MIXED_XTRA_MARKUP,
                  [declInfo.token.name],
                  sToken,
               );
               break;
         }
      } else {
         // 'ELEMENT_CONTENT'
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
         const isNoSpaceAtEndsVersion = this.confVer.version === 1 && this.confVer.edition === 1;
         const isSpaceAtEndsVersion = this.confVer.version === 1 && this.confVer.edition === 2;
         const isOnlySInEntityVersion =
            (this.confVer.version === 1 && this.confVer.edition > 2 && this.confVer.edition < 5) ||
            (this.confVer.version === 1.1 && this.confVer.edition === 1);
         const isTolerantVersion =
            (this.confVer.version === 1 && this.confVer.edition >= 5) ||
            (this.confVer.version === 1.1 && this.confVer.edition >= 2);

         const notAllowedParams = [
            declInfo.token.name,
            this.confVer.version.toString(),
            this.confVer.edition.toString(),
         ];

         if (xToken.type === SPACE_XTOKEN) {
            if (isNoSpaceAtEndsVersion && context.atElementContentStart) {
               this.pushValidityError(ValidityError.ID.ELEMENT_CONTENT_XTRA_SPACE, [], sToken);
            }
         } else {
            context.atElementContentStart = false;
         }

         switch (xToken.type) {
            case ELEMENT_START_XTOKEN:
            case ELEMENT_EMPTY_XTOKEN:
               break;
            case ELEMENT_END_XTOKEN:
               if (isNoSpaceAtEndsVersion && context.lastElementContentValue === SPACE_XTOKEN) {
                  this.pushValidityError(ValidityError.ID.ELEMENT_CONTENT_XTRA_SPACE, [], sToken);
               }
               break;
            case GENERAL_ENTITY_REFERENCE_XTOKEN:
            case GENERAL_ENTITY_START_XTOKEN:
            case GENERAL_ENTITY_END_XTOKEN:
               if (isNoSpaceAtEndsVersion || isSpaceAtEndsVersion) {
                  this.pushValidityError(
                     ValidityError.ID.ELEMENT_CONTENT_XTRA_CONTENT,
                     [...notAllowedParams, xToken.type],
                     sToken,
                  );
               }

               if (xToken.type === GENERAL_ENTITY_START_XTOKEN) {
                  context.elementContentEntityRefStack.push(xToken.name);
               } else if (xToken.type === GENERAL_ENTITY_END_XTOKEN) {
                  context.elementContentEntityRefStack.pop(); // might be nice to validate that it matches
               }
               break;
            case SPACE_XTOKEN:
               break;
            case PROCESSING_INSTRUCTION_XTOKEN:
               const piInEntity = context.elementContentEntityRefStack.length > 0;
               if (
                  (!isOnlySInEntityVersion || (isOnlySInEntityVersion && piInEntity)) &&
                  !isTolerantVersion
               ) {
                  this.pushValidityError(
                     ValidityError.ID.ELEMENT_CONTENT_XTRA_PI,
                     notAllowedParams,
                     sToken,
                  );
               }
               break;
            case COMMENT_XTOKEN:
               const inEntity = context.elementContentEntityRefStack.length > 0;
               if (
                  (!isOnlySInEntityVersion || (isOnlySInEntityVersion && inEntity)) &&
                  !isTolerantVersion
               ) {
                  this.pushValidityError(
                     ValidityError.ID.ELEMENT_CONTENT_XTRA_COMMENT,
                     notAllowedParams,
                     sToken,
                  );
               }
               break;
            case TEXTDECL_XTOKEN:
               // We don't care if there is a TEXTDECL in here.
               break;
            default:
               this.pushValidityError(
                  ValidityError.ID.ELEMENT_CONTENT_XTRA_CONTENT,
                  [...notAllowedParams, xToken.type],
                  sToken,
               );
               break;
         }

         // Keep track of the last thing we saw here, except for entity start and end markers, which are not "real".
         if (
            xToken.type !== GENERAL_ENTITY_START_XTOKEN &&
            xToken.type !== GENERAL_ENTITY_END_XTOKEN
         ) {
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
         if (
            xToken.type === CHARDATA_XTOKEN &&
            context &&
            context.declInfo.type === 'ELEMENT_CONTENT'
         ) {
            if (isSpace(xToken.text, this.confVer.version)) {
               xToken = new SpaceXToken(xToken.text);
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
         this.pushValidityError(ValidityError.ID.GEREF_UNDEFINED, [xToken.name], pToken);
      } else if (xToken.type === PARAMETER_ENTITY_REFERENCE_XTOKEN) {
         this.pushValidityError(ValidityError.ID.PEREF_UNDEFINED, [xToken.name], pToken);
      }

      if (xToken.type === NOTATION_DECLARATION_XTOKEN) {
         const notationDecl = xToken as NotationDeclarationXToken;
         this.notations[notationDecl.name] = notationDecl;
      } else if (xToken instanceof AttListDeclarationXToken) {
         this.validateAttListDecl(xToken);
      } else if (
         xToken instanceof GeneralEntityDeclarationXToken ||
         xToken instanceof ParameterEntityDeclarationXToken
      ) {
         if (!this.entityInfo[xToken.name]) {
            this.entityInfo[xToken.name] = {
               token: xToken,
               externallyDeclared: this.externalDeclarations,
            };
         }
         this.checkEntityDeclaration(xToken);
      } else if (xToken instanceof GeneralEntityStartXToken) {
         if (this.isInvalidEntityReference(xToken)) {
            this.pushValidityError(
               ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               [xToken.name],
               pToken,
            );
         }
      } else if (xToken instanceof ParameterEntityStartXToken) {
         if (this.isInvalidEntityReference(xToken)) {
            this.pushValidityError(
               ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               [xToken.name],
               pToken,
            );
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
      } else if (xToken instanceof ElementDeclarationXToken) {
         this.validateElementDecl(xToken);
      } else if (xToken instanceof DocTypeStartXToken) {
         this.docType = xToken;
      } else if (xToken instanceof ElementStartXToken || xToken instanceof ElementEmptyXToken) {
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
                     token: new ElementDeclarationXToken(
                        xToken.name,
                        ContentSpecType.ANY,
                        undefined,
                     ),
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
      }

      if (xToken.type === CONFORMANCE_VERSION) {
         this.confVer = xToken as any;
      }

      this.push(xToken);

      done();
   }

   private checkEntityDeclaration(
      xToken: GeneralEntityDeclarationXToken | ParameterEntityDeclarationXToken,
   ) {
      const name = xToken.name;
      const seen =
         xToken instanceof ParameterEntityDeclarationXToken
            ? this.paramEntitiesSeen
            : this.generalEntitiesSeen;

      // §4.2 If the same entity is declared more than once, ... at user option,
      // an XML processor may issue a warning if entities are declared multiple times.
      if (seen[name]) {
         const warningToken = new WarningToken(warning.id.ENTITYDECL_XRA_DECLARATION, [name]);
         this.push(warningToken);
      }

      seen[name] = xToken;
   }

   private validateAttListDecl(attListDecl: AttListDeclarationXToken) {
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
         this.pushWarning(
            warning.id.ATTLISTDECL_ELEMENT_XTRA_DECLARATION,
            [elName],
            openSToken,
            openSToken,
         );
         attrDefs.tokens.push(attListDecl);
      } else {
         attrDefs = {
            tokens: [attListDecl],
            attributes: {},
         };
         this.attrDefsByElementName[elName] = attrDefs;
      }

      // §3.3.0: At user option, an XML processor may issue a warning if attributes are declared for
      //    an element type not itself declared, but this is not an error.
      // Note: This takes the position that if the element wasn't declared before this, it is a warning.
      // Conceivably this should wait until the end of the DTD and then make this assessment.
      if (!this.elementDeclarations[elName]) {
         this.pushWarning(warning.id.ATTLISTDECL_NO_ELEMENTDECL, [elName], openSToken, openSToken);
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
            this.pushWarning(
               warning.id.ATTLISTDECL_ATTR_XTRA_DECLARATION,
               [elName, attDef.name],
               openSToken,
               openSToken,
            );
         }
      }
   }

   private validateAttrDef(attList: AttListDeclarationXToken, attDef: AttDefinitionXToken): void {
      const type = attDef.type.toUpperCase();
      const pToken = attList.pToken || ({} as AttListDeclarationPToken); // typeHack
      const defaultText = getAttributeValueText(attDef);

      // §2.10: concerning xml:space:
      //    it must be given as an enumerated type whose values are one or both of "default"
      //    and "preserve". ... It is an error for other values to be specified; the XML
      //    processor may report the error or may recover by ignoring the attribute
      //    specification or by reporting the (erroneous) value to the application.
      //    Applications may ignore or reject erroneous values.
      if (attDef.name.toLowerCase() === 'xml:space') {
         if (attDef.name !== 'xml:space') {
            this.pushValidityError(
               ValidityError.ID.ATTLISTDECL_SPACE_BAD_CASE,
               [attList.elementName, attDef.name],
               pToken.open,
            );
         }

         if (attDef.type !== 'ENUMERATION' || !attDef.enumeration) {
            this.pushValidityError(
               ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
               [attList.elementName],
               pToken.open,
            );
         } else if (attDef.enumeration.length === 0) {
            this.pushValidityError(
               ValidityError.ID.ATTLISTDECL_SPACE_MISSING_ENUMRATION,
               [attList.elementName],
               pToken.open,
            );
         } else {
            for (const element of attDef.enumeration) {
               if (element !== 'preserve' && element !== 'default') {
                  this.pushValidityError(
                     ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                     [attList.elementName, element],
                     pToken.open,
                  );
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
      this.checkAttributeValueForUnexpandedReferences(
         attDef.value,
         ValidityError.ID.ATTLISTDECL_REFERENCE_UNDEFINED,
         attDef.name,
         attList.elementName,
         pToken.open,
      );

      // §2.9
      if (type === 'ENTITY' && this.isInvalidEntityReference(defaultText)) {
         this.pushValidityError(
            ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
            [defaultText, attDef.name],
            pToken.open,
         );
      } else if (type === 'ENTITIES') {
         if (defaultText) {
            const names = defaultText.split(/ +/);

            for (const name of names) {
               // §2.9
               if (this.isInvalidEntityReference(name)) {
                  this.pushValidityError(
                     ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
                     [name, attDef.name],
                     pToken.open,
                  );
               }
            }
         }
      }
   }

   private checkAttributeValueForUnexpandedReferences(
      value: LiteralValueX,
      errorId: string,
      attrName: string,
      elementName: string,
      context?: SToken,
   ) {
      for (const element of value) {
         if (
            element.type === GENERAL_ENTITY_REFERENCE_XTOKEN ||
            element.type === PARAMETER_ENTITY_REFERENCE_XTOKEN
         ) {
            this.pushValidityError(
               errorId,
               [(element as any).name, attrName, elementName],
               context,
            );
         }
      }
   }

   private findDuplicateNamesInEnumeration(names: ReadonlyArray<string>): Array<string> {
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

   private validateElementDecl(elDecl: ElementDeclarationXToken): void {
      // const openSToken = elDecl.pToken && elDecl.pToken.open;
      let isMixed = false;

      // Validity Constraint: §3.2.0: Validity constraint: Unique Element Type Declaration
      //    An element type must not be declared more than once.
      // if (this.elementDeclarations[elDecl.name]) {
      //    this.pushValidityError(
      //       ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
      //       [elDecl.name],
      //       openSToken,
      //    );
      //    return;
      // }

      if (elDecl.contentSpec === 'EMPTY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: 'EMPTY_CONTENT',
         };
      } else if (elDecl.contentSpec === 'ANY') {
         this.elementDeclarations[elDecl.name] = {
            token: elDecl,
            type: 'ANY_CONTENT',
         };
      } else {
         const children: ContentModelX | undefined = elDecl.contentModel || {
            particles: [],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
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
         }

         if (isMixed) {
            this.elementDeclarations[elDecl.name] = {
               token: elDecl,
               type: 'MIXED_CONTENT',
            };
         } else {
            if (!this.elementDeclarations[elDecl.name]) {
               this.elementDeclarations[elDecl.name] = {
                  token: elDecl,
                  type: 'ELEMENT_CONTENT',
                  externallyDeclared: this.externalDeclarations, // §2.9
               } as any;
            }
         }
      }
   }

   private validateElementStart(elStart: ElementStartXToken | ElementEmptyXToken) {
      const elemAttrDef = this.attrDefsByElementName[elStart.name];
      const elementDecl = this.elementDeclarations[elStart.name];
      const attributes = elStart.attributes;
      const pTokenOpen = elStart.pToken && elStart.pToken.open;

      // §3.3.3: Normalization
      for (let index = 0; index < attributes.length; index++) {
         const attrName = attributes[index].name;
         const attrInfo = elemAttrDef && elemAttrDef.attributes[attrName];

         // eeek
         (attributes[index] as any).value = this.normalizeAttributeValue(
            attributes[index],
            attrInfo,
         );
      }

      for (const attribute of attributes) {
         // §2.9
         this.checkAttributeValueStandaloneability(
            attribute.name,
            attribute.value,
            pTokenOpen,
            true,
         );
         // §4.1: Validity Constraint: Entity Declared
         //    ...the Name given in the entity reference must match that in an entity declaration...
         this.checkAttributeValueForUnexpandedReferences(
            attribute.value,
            ValidityError.ID.ELEMENTSTART_REFERENCE_UNDEFINED,
            attribute.name,
            elStart.name,
            pTokenOpen,
         );
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
         warningId = warning.id.ELEMENT_EMPTY_WITH_NONEMPTY_DECL;
      } else if (!tokenIsEmptyType && declarationIsEmpty) {
         // warningId = warning.id.ELEMENT_WITH_EMPTY_DECL;
      }

      if (warningId) {
         this.pushWarning(warningId, [elStart.name], pTokenOpen, pTokenOpen);
      }
   }
}

interface NamesMap {
   [elName: string]: true;
}

function getNamesFromList(children: ContentModelX): NamesMap {
   let childNames: NamesMap = {};
   for (let index = 0; index < children.particles.length; index++) {
      const child = children.particles[index];

      if (isContentNameX(child)) {
         childNames[child.name] = true;
      } else {
         childNames = Object.assign(childNames, getNamesFromList(child));
      }
   }

   return childNames;
}

export default CheckXTokenValidStream;
