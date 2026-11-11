/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';
import {
   CharRefPToken,
   parseCharRef,
   GeneralEntityReferencePToken,
   parseGeneralEntityReference,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
} from 'pToken';
import { ParameterEntityReferencePToken, TextPToken, parseParameterEntityReference } from 'pToken';

import { GeneralEntityEndPToken } from '../marker/generalEntityEnd';
import { GeneralEntityStartPToken } from '../marker/generalEntityStart';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';

// <typeHack>
// type EntityReferencePToken = { type: string };
// function isTextPToken(item: any): item is TextPToken {
//    return item.type === TEXT_PTOKEN;
// }
// </typeHack>

type Terminators = Array<'&' | '&#' | '%' | '"' | "'">;
type LiteralValuePToken = Array<
   | TextPToken
   | CharRefPToken
   | GeneralEntityReferencePToken
   | ParameterEntityReferencePToken
   | GeneralEntityStartPToken
   | GeneralEntityEndPToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken
>;
type DeliverValue = (valuePToken: LiteralValuePToken) => void;

/**********************************************************************\
 This the value part of an literal value (that is, the text between
 quotes) which may include strings and entity references intermixed.

 Crucially, this will parse up to the first quote (of the type provided
 in `terminators`, but not actually consume the quote.  By implication,
 you MUST provide a quote character in terminators. The various entity
 reference opening characters are optional.

 SYNTAX
    [9] EntityValue   ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                          "'" ([^%&'] | PEReference | Reference)* "'"
   [10] AttValue      ::= '"' ([^<&"] | Reference)* '"'
                          |  "'" ([^<&'] | Reference)* "'"
   [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
   [12] PubidLiteral  ::= '"' PubidChar* '"' |
                          "'" (PubidChar - "'")* "'"
   [13] PubidChar     ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]

   ALSO parsing "unknown" quoted values after a PERef
   and the relevant parts of
   [24] VersionInfo   ::= S 'version' Eq ("'" VersionNum "'" |
                          '"' VersionNum '"')
   [25] Eq            ::= S? '=' S?
   [26] VersionNum    ::= '1.' [0-9]+
   [32] SDDecl        ::= S 'standalone' Eq (("'" ('yes' | 'no')"'") |
                          ('"' ('yes' | 'no') '"'))
   [80] EncodingDecl  ::= S 'encoding' Eq ('"' EncName '"' |
                          "'" EncName "'" )
   [81] EncName       ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
\**********************************************************************/

function parse(source: STokenSource, terminators: Terminators, deliverPToken: DeliverValue): void {
   const container: { sToken?: SToken } = {};

   source.extractToObject('all', terminators, container, 'sToken');
   source.extract('peekChar', (charSToken) => {
      let currentValue: LiteralValuePToken = [];

      if (container.sToken) {
         currentValue = [new TextPToken({ text: container.sToken })];
      }

      // End of file.
      if (!charSToken) {
         deliverPToken(currentValue);
         return;
      }

      function handleRef(
         refPToken:
            | GeneralEntityReferencePToken
            | ParameterEntityReferencePToken
            | CharRefPToken
            | void,
      ) {
         parse(source, terminators, (rest) => {
            rest.unshift(
               refPToken as
                  | GeneralEntityReferencePToken
                  | ParameterEntityReferencePToken
                  | CharRefPToken,
            ); // typeHack
            deliverPToken(currentValue.concat(rest));
         });
      }

      switch (charSToken.str[0]) {
         case '"': // Note Cody will only notice one of these (the one passed in through terminators)
         case "'":
            deliverPToken(currentValue);
            break;
         case '%':
            parseParameterEntityReference(source, handleRef);
            break;
         case '&':
            source.extract('multi', ['&', '&#'], (opening) => {
               if (opening && opening.str === '&') {
                  parseGeneralEntityReference(source, opening!, handleRef); // typeHack
               } else {
                  parseCharRef(source, opening!, handleRef);
               }
            });
            break;
      }
   });
}

const parseLiteralValue = parse;
export { LiteralValuePToken, Terminators, parse, parseLiteralValue };

export default {
   parse,
};
