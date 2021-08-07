/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { warning, WarningToken } from 'basic';
import { SToken } from 'sToken';
import {
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
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,
   ParameterEntityDeclarationXToken,
   NOTATION_DECLARATION_XTOKEN,
} from 'xToken';

import { ContentSpecType } from 'xToken';

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
   token: ElementDeclarationXToken;
}

type ElementDeclInfo =
   | AnyContentDeclInfo
   | EmptyContentDeclInfo
   | MixedContentDeclInfo
   | ElementContentDeclInfo;
interface ContentContext {
   declInfo: ElementDeclInfo;
   stateId: number;
}

class CheckXTokenValidStream extends Transform {
   private attrDefsByElementName: ElementAttributes;

   private elementDeclarations: { [name: string]: ElementDeclInfo };

   private contentStack: Array<ContentContext>;

   private currentContext: ContentContext | undefined;

   constructor() {
      super({
         objectMode: true,
      });

      this.attrDefsByElementName = {};
      this.elementDeclarations = {};
      this.contentStack = [];
      this.currentContext = undefined;
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

   _transform(xToken: XToken, _: string, done: StreamCallback) {
      if (xToken.type === NOTATION_DECLARATION_XTOKEN) {
      } else if (xToken instanceof AttListDeclarationXToken) {
         this.validateAttListDecl(xToken);
      } else if (
         xToken instanceof GeneralEntityDeclarationXToken ||
         xToken instanceof ParameterEntityDeclarationXToken
      ) {
      } else if (xToken instanceof GeneralEntityStartXToken) {
      } else if (xToken instanceof ParameterEntityStartXToken) {
      } else if (xToken instanceof ParameterEntityEndXToken) {
      } else if (xToken instanceof ElementDeclarationXToken) {
         this.validateElementDecl(xToken);
      } else if (xToken instanceof DocTypeStartXToken) {
      } else if (xToken instanceof ElementStartXToken || xToken instanceof ElementEmptyXToken) {
         if (xToken instanceof ElementStartXToken) {
            if (this.elementDeclarations[xToken.name]) {
               this.currentContext = {
                  // atElementContentStart: true,
                  declInfo: this.elementDeclarations[xToken.name],
                  // elementContentEntityRefStack: [],
                  // lastElementContentValue: '',
                  stateId: 0,
               };
            } else {
               this.currentContext = {
                  // atElementContentStart: true,
                  declInfo: {
                     token: new ElementDeclarationXToken(
                        xToken.name,
                        ContentSpecType.ANY,
                        undefined,
                     ),
                     type: 'ANY_CONTENT',
                  },
                  // elementContentEntityRefStack: [],
                  // lastElementContentValue: '',
                  stateId: 0,
               };
            }

            if (this.currentContext) {
               this.contentStack.push(this.currentContext);
            }
         }
      } else if (xToken instanceof ElementEndXToken) {
         this.contentStack.pop();
         this.currentContext = this.contentStack[this.contentStack.length - 1];
      }

      this.push(xToken);

      done();
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
         // // §3.3: For interoperability, writers of DTDs may choose to provide at most one
         // //   attribute-list declaration for a given element type ... For interoperability,
         // //   an XML processor may at user option issue a warning when more than one
         // //   attribute-list declaration is provided for a given element type,
         // this.pushWarning(
         //    warning.id.ATTLISTDECL_ELEMENT_XTRA_DECLARATION,
         //    [elName],
         //    openSToken,
         //    openSToken,
         // );
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

         if (!attrDefs.attributes[attDef.name]) {
            // §3.3.0: When more than one AttlistDecl is provided for a given element type, the contents of
            //   all those provided are merged. When more than one definition is provided for the same
            //   attribute of a given element type, the first declaration is binding and later
            //   declarations are ignored. ...
            attrDefs.attributes[attDef.name] = {
               def: attDef,
            };
         } else {
            // §3.3.0: ... For interoperability, an XML processor may at user option
            //   issue a warning when ... more than one attribute definition is provided for a given
            //   attribute, but this is not an error.
            // this.pushWarning(
            //    warning.id.ATTLISTDECL_ATTR_XTRA_DECLARATION,
            //    [elName, attDef.name],
            //    openSToken,
            //    openSToken,
            // );
         }
      }
   }

   private validateElementDecl(elDecl: ElementDeclarationXToken): void {
      let isMixed = false;

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
            listType: CpType.CHOICE,
            particles: [],
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
               } as any;
            }
         }
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
