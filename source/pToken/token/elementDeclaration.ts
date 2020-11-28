import { SToken, STokenSource } from 'sToken';

import { parseUnexpanded } from '../common/parseUnexpanded';
import { ContentModelP, parseContentModel } from '../common/contentModel';
import { UnexpandedMarkupDetails } from '../types';

import { DeclarationStart } from 'token';

type DeliverCB = (ptoken: ElementDeclarationPToken) => void;

const ELEMENT_DECLARATION_PTOKEN = 'ELEMENT_DECLARATION_PTOKEN';

interface ElementDeclarationProps {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   contentSpec?: SToken;
   contentSpecSpace?: SToken;
   contentModel?: ContentModelP;
   unexpanded?: UnexpandedMarkupDetails;
   extra?: SToken | false;
   close?: SToken;
}

type RawElementDeclaration = ElementDeclarationProps & {
   open: SToken;
};

function isNotDeclarationStart(
   token: ElementDeclarationPToken | RawElementDeclaration | DeclarationStart,
): token is ElementDeclarationPToken | RawElementDeclaration {
   return (
      'name' in token ||
      'nameSpace' in token ||
      'contentSpec' in token ||
      'contentSpecSpace' in token ||
      'contentModel' in token ||
      'close' in token ||
      'unexpanded' in token ||
      'extra' in token
   );
}

class ElementDeclarationPToken {
   public readonly type: typeof ELEMENT_DECLARATION_PTOKEN = ELEMENT_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace: SToken | undefined;

   public readonly declType: SToken | undefined;

   public readonly declTypeSpace: SToken | undefined;

   public readonly name?: SToken;

   public readonly nameSpace?: SToken;

   public readonly contentSpec?: SToken;

   public readonly contentSpecSpace?: SToken;

   public readonly contentModel?: ContentModelP;

   public readonly unexpanded: UnexpandedMarkupDetails | undefined;

   public readonly extra: SToken | false | undefined;

   public readonly close?: SToken;

   constructor(
      props: ElementDeclarationPToken | RawElementDeclaration | DeclarationStart,
      other: ElementDeclarationProps = {},
   ) {
      this.open = other.open ?? props.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : props.openSpace;
      this.declType = 'declType' in other ? other.declType : props.declType;
      this.declTypeSpace = 'declTypeSpace' in other ? other.declTypeSpace : props.declTypeSpace;

      if (isNotDeclarationStart(props)) {
         this.name = props.name;
         this.nameSpace = props.nameSpace;
         this.contentSpec = props.contentSpec;
         this.contentSpecSpace = props.contentSpecSpace;
         this.contentModel = props.contentModel;
         this.unexpanded = props.unexpanded;
         this.extra = props.extra;
         this.close = props.close;
      }

      this.name = 'name' in other ? other.name : this.name;
      this.nameSpace = 'nameSpace' in other ? other.nameSpace : this.nameSpace;
      this.contentSpec = 'contentSpec' in other ? other.contentSpec : this.contentSpec;
      this.contentSpecSpace =
         'contentSpecSpace' in other ? other.contentSpecSpace : this.contentSpecSpace;
      this.contentModel = 'contentModel' in other ? other.contentModel : this.contentModel;
      this.unexpanded = 'unexpanded' in other ? other.unexpanded : this.unexpanded;
      this.extra = 'extra' in other ? other.extra : this.extra;
      this.close = 'close' in other ? other.close : this.close;
   }
}

function parseName(
   source: STokenSource,
   tokens: RawElementDeclaration,
   deliver: (result: RawElementDeclaration) => void,
): void {
   source.extractToObject('word', ['>', '('], tokens, 'name');
   source.extractNoParams('space', (nameSpace) => {
      tokens.nameSpace = nameSpace;

      deliver(tokens);
   });
}

function parseSimpleContentSpec(
   source: STokenSource,
   tokens: RawElementDeclaration,
   deliver: (result: RawElementDeclaration | undefined) => void,
): void {
   source.extractNoParams('peekChar', (charSToken) => {
      if (!charSToken) {
         deliver(undefined);
         return;
      }

      if (charSToken.str !== '(') {
         source.extractToObject('word', ['>'], tokens, 'contentSpec');
         source.extractNoParams('space', (contentSpecSpace) => {
            tokens.contentSpecSpace = contentSpecSpace;
            deliver(tokens);
         });
      } else {
         deliver(undefined);
      }
   });
}

function parseComplexContentSpec(
   source: STokenSource,
   tokens: RawElementDeclaration,
   deliver: (result: RawElementDeclaration) => void,
): void {
   parseContentModel(source, (contentModel) => {
      tokens.contentModel = contentModel;
      deliver(tokens);
   });
}

function parseClose(
   source: STokenSource,
   tokens: RawElementDeclaration,
   deliverPToken: DeliverCB,
): void {
   source.extract('match', '>', (sToken) => {
      tokens.close = sToken;

      deliverPToken(new ElementDeclarationPToken(tokens));
   });
}

function resumeParseProperties(
   source: STokenSource,
   propName: string,
   props: RawElementDeclaration,
   deliverPToken: DeliverCB,
): void {
   switch (propName) {
      case 'name':
         parseName(source, props, (withName) => {
            resumeParseProperties(source, 'contentSpec', withName, deliverPToken);
         });
         break;
      case 'contentSpec':
         parseSimpleContentSpec(source, props, (withContentSpec) => {
            if (withContentSpec) {
               deliverPToken(new ElementDeclarationPToken(withContentSpec));
               return;
            } else {
               parseComplexContentSpec(source, props, (withComplexContentSpec) => {
                  deliverPToken(new ElementDeclarationPToken(withComplexContentSpec));
               });
            }
         });
         break;
      case 'midSpec':
         // parseSimpleContentSpec(source, props, (withContentSpec) => {
         //    if (withContentSpec) {
         //       parseClose(source, props, deliverPToken);
         //       return;
         //    } else {
         //       parseComplexContentSpec(source, props, (withComplexContentSpec) => {
         //          parseClose(source, withComplexContentSpec, deliverPToken);
         //       });
         //    }
         // });
         break;
   }
}

function resumeParseElementDeclaration(
   source: STokenSource,
   elementDeclaration: ElementDeclarationPToken,
   deliverPToken: DeliverCB,
): void {
   if (!elementDeclaration.unexpanded) {
      deliverPToken(elementDeclaration);
      return;
   }

   resumeParseProperties(
      source,
      elementDeclaration.unexpanded.propName,
      { ...elementDeclaration },
      deliverPToken,
   );
}

/**********************************************************************\
 parse() extracts an element declaration.

 This assumes that the "<!ELEMENT" has already been processed and has
 been passed as an argument to this.

 PARAM
   source: A STokenSource to read from
   declarationPToken: The pToken value from declaration
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   §3.2.0
   [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
   [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | contentModel
   Note that Mixed and contentModel are handled by nameList
\**********************************************************************/

function parseElementDeclaration(
   source: STokenSource,
   declarationPToken: DeclarationStart,
   deliverPToken: DeliverCB,
): void {
   const protoToken: RawElementDeclaration = { ...declarationPToken };

   parseUnexpanded(source, 'name', (unexpanded) => {
      if (unexpanded) {
         protoToken.unexpanded = unexpanded;
         parseClose(source, protoToken, deliverPToken);
         return;
      }

      parseName(source, protoToken, (withName) => {
         parseUnexpanded(source, 'contentModel', (unexpanded) => {
            if (unexpanded) {
               withName.unexpanded = unexpanded;
               parseClose(source, withName, deliverPToken);
               return;
            }

            parseSimpleContentSpec(source, withName, (withContentSpec) => {
               if (withContentSpec) {
                  parseClose(source, withContentSpec, deliverPToken);
                  return;
               }

               parseComplexContentSpec(source, withName, (withComplexContentSpec) => {
                  parseUnexpanded(source, 'midSpec', (unexpanded) => {
                     if (unexpanded) {
                        withComplexContentSpec.unexpanded = unexpanded;
                        parseClose(source, withComplexContentSpec, deliverPToken);
                        return;
                     }

                     parseClose(source, withComplexContentSpec, deliverPToken);
                  });
               });
            });
         });
      });
   });
}

export {
   ELEMENT_DECLARATION_PTOKEN,
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
};
