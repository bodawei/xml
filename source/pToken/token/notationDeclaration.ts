/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

import { parseUnexpanded } from '../common/parseUnexpanded';

import { DeclarationStart } from '../../token/bridge/declaration';
import { ExternalId, parseExternalId } from '../common/externalId';
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
   externalId?: ExternalId;
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

   public readonly externalId: ExternalId | undefined;

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
   protoToken: NotationDeclarationProps,
   notationDeclaration: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
) {
   parseExternalId(source, ['>'], true, (result) => {
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
   notationDeclaration: NotationDeclarationPToken,
   deliverPToken: DeliverPToken,
): void {
   const protoToken: NotationDeclarationProps = {};

   if (notationDeclaration.unexpanded?.propName === 'name') {
      parseName(source, protoToken, () => {
         resumeExternalParse(source, protoToken, notationDeclaration, deliverPToken);
      });
   } else {
      if (notationDeclaration.unexpanded?.propName) {
         resumeExternalParse(source, protoToken, notationDeclaration, deliverPToken);
      } else {
         deliverPToken(notationDeclaration);
      }
   }
}

export {
   NOTATION_DECLARATION_PTOKEN,
   parseNotationDeclaration,
   resumeParseNotationDeclaration,
   NotationDeclarationPToken,
};
