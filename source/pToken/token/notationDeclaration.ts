/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

import { parseUnexpanded } from '../common/parseUnexpanded';

import { DeclarationStart } from '../../token/bridge/declaration';
import { ExternalId, parseExternalId } from '../../token/common/externalId';
import { UnexpandedDetails, UnexpandedToken } from '../types';

const NOTATION_DECLARATION_PTOKEN = 'NOTATION_DECLARATION_PTOKEN2';

type DeliverPToken = (pToken: NotationDeclarationPToken) => void;

interface RawNotationDeclaration {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   externalId?: ExternalId;
   externalIdSpace?: SToken;
   unexpanded?: UnexpandedDetails | undefined;
   close?: SToken;
}

function isNotationDeclaration(
   token: NotationDeclarationPToken | DeclarationStart,
): token is NotationDeclarationPToken {
   return 'type' in token && token.type === NOTATION_DECLARATION_PTOKEN;
}

class NotationDeclarationPToken {
   public readonly type: typeof NOTATION_DECLARATION_PTOKEN = NOTATION_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace: SToken | undefined;

   public readonly declType: SToken | undefined;

   public readonly declTypeSpace: SToken | undefined;

   public readonly name: SToken | undefined;

   public readonly nameSpace: SToken | undefined;

   public readonly externalId: ExternalId | undefined;

   public readonly externalIdSpace: SToken | undefined;

   public readonly close: SToken | undefined;

   public readonly unexpanded: UnexpandedDetails | undefined;

   public readonly extra: Array<UnexpandedToken> | undefined;

   constructor(
      props: NotationDeclarationPToken | DeclarationStart,
      other?: RawNotationDeclaration,
   ) {
      this.open = other?.open ?? props.open;
      this.openSpace = other?.openSpace ?? props.openSpace;
      this.declType = other?.declType ?? props.declType;
      this.declTypeSpace = other?.declTypeSpace ?? props.declTypeSpace;
      this.name = other?.name ?? (isNotationDeclaration(props) ? props.name : undefined);
      this.nameSpace =
         other?.nameSpace ?? (isNotationDeclaration(props) ? props.nameSpace : undefined);
      this.externalId =
         other?.externalId ?? (isNotationDeclaration(props) ? props.externalId : undefined);
      this.externalIdSpace =
         other?.externalIdSpace ??
         (isNotationDeclaration(props) ? props.externalIdSpace : undefined);
      this.close = other?.close ?? (isNotationDeclaration(props) ? props.close : undefined);
      this.unexpanded = undefined;
      this.extra = undefined;
   }
}

function parseClose(
   source: STokenSource,
   tokenStart: DeclarationStart,
   protoToken: RawNotationDeclaration,
   deliverPToken: DeliverPToken,
): void {
   source.extract('match', '>', (sToken) => {
      protoToken.close = sToken;

      deliverPToken(new NotationDeclarationPToken(tokenStart, protoToken));
   });
}

function parseName(
   source: STokenSource,
   protoToken: RawNotationDeclaration,
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
   const protoToken: RawNotationDeclaration = {};

   parseUnexpanded(source, 'name', (unexpanded) => {
      if (unexpanded) {
         protoToken.unexpanded = unexpanded;
         parseClose(source, declarationStart, protoToken, deliverPToken);
         return;
      }

      parseName(source, protoToken, () => {
         parseExternalId(source, ['>'], true, (args) => {
            const { externalId, nextPropName } = args;
            protoToken.externalId = externalId;

            if (nextPropName) {
               parseUnexpanded(source, nextPropName, (innerunexpanded) => {
                  protoToken.unexpanded = innerunexpanded;
                  parseClose(source, declarationStart, protoToken, deliverPToken);
               });
            } else {
               source.extractToObjectNoParams('space', protoToken, 'externalIdSpace');
               parseClose(source, declarationStart, protoToken, deliverPToken);
            }
         });
      });
   });
}

function resumeExternalParse(
   source: STokenSource,
   protoToken: RawNotationDeclaration,
   notationDeclaration: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
) {
   parseExternalId(source, ['>'], true, (result) => {
      protoToken.externalId = result.externalId;
      source.extractNoParams('space', (sToken) => {
         protoToken.externalIdSpace = sToken;
         deliverPToken(new NotationDeclarationPToken(notationDeclaration, protoToken));
      });
   });
}

function resumeParseNotationDeclaration(
   source: STokenSource,
   notationDeclaration: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
): void {
   const protoToken: RawNotationDeclaration = {};

   if (notationDeclaration.unexpanded?.propName === 'name') {
      parseName(source, protoToken, () => {
         resumeExternalParse(source, protoToken, notationDeclaration, deliverPToken);
      });
   } else {
      resumeExternalParse(source, protoToken, notationDeclaration, deliverPToken);
   }
}
export { parseNotationDeclaration, resumeParseNotationDeclaration, NotationDeclarationPToken };
