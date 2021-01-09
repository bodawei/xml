/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { combineSTokens, SToken, STokenSource } from 'sToken';

import { parseUnexpanded } from '../common/parseUnexpanded';

import { DeclarationStart } from '../../token/bridge/declaration';
import { ExternalIdP, parseExternalId, resumeParseExternalId } from '../common/externalId';
import { UnexpandedMarkupDetails } from '../types';

const NOTATION_DECLARATION_PTOKEN = 'NOTATION_DECLARATION_PTOKEN';

type DeliverPToken = (pToken: NotationDeclarationPToken) => void;

interface NotationDeclarationProps {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   externalId?: ExternalIdP;
   externalIdSpace?: SToken;
   unexpanded?: UnexpandedMarkupDetails | undefined;
   extra?: SToken | false;
   close?: SToken;
}

type RawNotationDeclaration = NotationDeclarationProps & {
   open: SToken;
};

function isNotDeclarationStart(
   token: NotationDeclarationPToken | RawNotationDeclaration | DeclarationStart,
): token is NotationDeclarationPToken | RawNotationDeclaration {
   return (
      'name' in token ||
      'nameSpace' in token ||
      'externalId' in token ||
      'externalIdSpace' in token ||
      'close' in token ||
      'unexpanded' in token ||
      'extra' in token
   );
}

class NotationDeclarationPToken {
   public readonly type: typeof NOTATION_DECLARATION_PTOKEN = NOTATION_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace: SToken | undefined;

   public readonly declType: SToken | undefined;

   public readonly declTypeSpace: SToken | undefined;

   public readonly name: SToken | undefined;

   public readonly nameSpace: SToken | undefined;

   public readonly externalId: ExternalIdP | undefined;

   public readonly externalIdSpace: SToken | undefined;

   public readonly close: SToken | undefined;

   public readonly unexpanded: UnexpandedMarkupDetails | undefined;

   public readonly extra: SToken | false | undefined;

   constructor(
      props: NotationDeclarationPToken | RawNotationDeclaration | DeclarationStart,
      other: NotationDeclarationProps = {},
   ) {
      this.open = other.open ?? props.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : props.openSpace;
      this.declType = 'declType' in other ? other.declType : props.declType;
      this.declTypeSpace = 'declTypeSpace' in other ? other.declTypeSpace : props.declTypeSpace;

      if (isNotDeclarationStart(props)) {
         this.name = props.name;
         this.nameSpace = props.nameSpace;
         this.externalId = props.externalId;
         this.externalIdSpace = props.externalIdSpace;
         this.unexpanded = props.unexpanded;
         this.extra = props.extra;
         this.close = props.close;
      }

      this.name = 'name' in other ? other.name : this.name;
      this.nameSpace = 'nameSpace' in other ? other.nameSpace : this.nameSpace;
      this.externalId = 'externalId' in other ? other.externalId : this.externalId;
      this.externalIdSpace =
         'externalIdSpace' in other ? other.externalIdSpace : this.externalIdSpace;
      this.unexpanded = 'unexpanded' in other ? other.unexpanded : this.unexpanded;
      this.extra = 'extra' in other ? other.extra : this.extra;
      this.close = 'close' in other ? other.close : this.close;
   }
}

function parseClose(
   source: STokenSource,
   tokenStart: DeclarationStart,
   protoToken: NotationDeclarationProps,
   deliverPToken: DeliverPToken,
): void {
   source.extract('match', '>', (sToken) => {
      protoToken.close = sToken;

      deliverPToken(new NotationDeclarationPToken(tokenStart, protoToken));
   });
}

function parseName(
   source: STokenSource,
   protoToken: NotationDeclarationProps,
   done: () => void,
): void {
   source.extractToObject('word', ['>'], protoToken, 'name');
   source.extractToObjectNoParams('space', protoToken, 'nameSpace');
   done();
}

/**********************************************************************\
 parseNotationDeclaration() extracts a notation declaration.

 This assumes that the "<!NOTATION" has already been processed and has
 been passed as an argument to this

 PARAM
 source: A STokenSource to read from
 declarationPToken: The pToken value from declaration
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.7
      [82] NotationDecl ::=
         '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
   Lax:
      [82] NotationDecl ::=
         '<! S? NOTATION' S? Name S? (ExternalID | PublicID) S? '>'
\**********************************************************************/

function parseNotationDeclaration(
   source: STokenSource,
   declarationStart: DeclarationStart,
   deliverPToken: DeliverPToken,
): void {
   const protoToken: NotationDeclarationProps = {};

   parseUnexpanded(source, 'name', (unexpanded) => {
      if (unexpanded) {
         protoToken.unexpanded = unexpanded;
         parseClose(source, declarationStart, protoToken, deliverPToken);
         return;
      }

      parseName(source, protoToken, () => {
         parseExternalId(source, ['>'], (extIdInfo) => {
            const { externalId, nextPropName } = extIdInfo || {};
            protoToken.externalId = externalId;

            if (nextPropName) {
               parseUnexpanded(source, nextPropName, (innerunexpanded) => {
                  protoToken.unexpanded = innerunexpanded;
                  parseClose(source, declarationStart, protoToken, deliverPToken);
               });
            } else {
               source.extractToObjectNoParams('space', protoToken, 'externalIdSpace');

               parseUnexpanded(source, 'trailing', (innerunexpanded) => {
                  protoToken.unexpanded = innerunexpanded;
                  parseClose(source, declarationStart, protoToken, deliverPToken);
               });
            }
         });
      });
   });
}

function resumeExternalParse(
   source: STokenSource,
   preSpace: SToken | undefined,
   propName: string,
   protoToken: NotationDeclarationProps,
   notationDeclaration: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
) {
   resumeParseExternalId(source, propName, preSpace, notationDeclaration.externalId, (result) => {
      protoToken.externalId = result.externalId;
      source.extractToObjectNoParams('space', protoToken, 'externalIdSpace');
      source.extract('all', [], (sToken) => {
         if (sToken) {
            protoToken.extra = sToken;
         }

         deliverPToken(new NotationDeclarationPToken(notationDeclaration, protoToken));
      });
   });
}

function resumeParseNotationDeclaration(
   source: STokenSource,
   decl: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
): void {
   const protoToken: NotationDeclarationProps = { ...decl };
   if (!decl.unexpanded) {
      deliverPToken(decl);
      return;
   }

   source.extractNoParams('space', (preSpace) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const propName = decl.unexpanded!.propName;

      if (propName === 'name') {
         parseName(source, protoToken, () => {
            protoToken.declTypeSpace = combineSTokens(protoToken.declTypeSpace, preSpace);

            resumeExternalParse(source, undefined, 'externalType', protoToken, decl, deliverPToken);
         });
      } else if (propName === 'trailing') {
         protoToken.externalIdSpace = combineSTokens(protoToken.externalIdSpace, preSpace);
         deliverPToken(new NotationDeclarationPToken(decl, protoToken));
      } else {
         resumeExternalParse(source, preSpace, propName, protoToken, decl, deliverPToken);
      }
   });
}

export {
   NOTATION_DECLARATION_PTOKEN,
   parseNotationDeclaration,
   resumeParseNotationDeclaration,
   NotationDeclarationPToken,
};
