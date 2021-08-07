/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { warning, WarningToken } from 'basic';
import { SToken } from 'sToken';
import {
   AttListDeclarationXToken,
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
   private elementDeclarations: { [name: string]: ElementDeclInfo };

   private contentStack: Array<ContentContext>;

   private currentContext: ContentContext | undefined;

   constructor() {
      super({
         objectMode: true,
      });

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
