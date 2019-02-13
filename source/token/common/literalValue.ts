/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector } from 'error';
import { SToken, STokenSource } from 'sToken';

import { TextPToken, TextXToken, isTextPToken } from '../text';
import misc from './misc';
import { GeneralEntityReferencePToken, GeneralEntityReferenceXToken, parseGeneralEntityReference } from '../generalEntityReference';
import { parseParameterEntityReference, ParameterEntityReferencePToken, ParameterEntityReferenceXToken } from '../parameterEntityReference';
import { CharRefPToken, CharRefXToken, parseCharRef } from '../charRef';
import { GeneralEntityStartPToken, GeneralEntityStartXToken } from '../marker/generalEntityStart';
import { GeneralEntityEndPToken, GeneralEntityEndXToken } from '../marker/generalEntityEnd';

// <typeHack>
   // type EntityReferencePToken = { type: string };
   // function isTextPToken(item: any): item is TextPToken {
   //    return item.type === TEXT_PTOKEN;
   // }
// </typeHack>

type Terminators = Array<'&'|'&#'|'%'|'"'|'\''>;
type LiteralValuePToken = Array<TextPToken|CharRefPToken|GeneralEntityReferencePToken|ParameterEntityReferencePToken|GeneralEntityStartPToken|GeneralEntityEndPToken>;
type LiteralValueXToken = Array<TextXToken|CharRefXToken|GeneralEntityReferenceXToken|ParameterEntityReferenceXToken|GeneralEntityStartXToken|GeneralEntityEndXToken>;
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
   source.extractNoParams('peekChar', (charSToken) => {
      let currentValue: LiteralValuePToken = [];

      if (container.sToken) {
         currentValue = [ new TextPToken({ text: container.sToken }) ];
      }

      // End of file.
      if (!charSToken) {
         deliverPToken(currentValue);
         return;
      }

      function handleRef(refPToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken | CharRefPToken |void) {
         parse(source, terminators, (rest) => {
            rest.unshift(refPToken as GeneralEntityReferencePToken | ParameterEntityReferencePToken | CharRefPToken); // typeHack
            deliverPToken(currentValue.concat(rest));
         });
      }

      switch (charSToken.str[0]) {
         case '"': // Note Cody will only notice one of these (the one passed in through terminators)
         case '\'':
            deliverPToken(currentValue);
            break;
         case '%':
            parseParameterEntityReference(source, handleRef);
            break;
         case '&':
            source.extract('multi', [ '&', '&#' ], (opening) => {
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

/**********************************************************************\
 Checks that the PToken is well-formed.
\**********************************************************************/

function checkWellFormed(pToken: LiteralValuePToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   for (let index = 0; index < pToken.length; index++) {
      const item = pToken[index];

      if (isTextPToken(item)) {
         ec.setPos(item.text);
         misc.checkWellFormedText(item.text, ec, entityMetaData);
      } else if (!(item instanceof GeneralEntityStartPToken || item instanceof GeneralEntityEndPToken)) {
         item.checkWellFormed(ec, entityMetaData);
      }
   }
}

/**********************************************************************\
 Builds a value which can be put in an XToken
\**********************************************************************/

function makeXTokenCompatible(pToken: LiteralValuePToken): LiteralValueXToken {
   const value: LiteralValueXToken = [];

   for (let index = 0; index < pToken.length; index++) {
      const item = pToken[index];

      if (isTextPToken(item)) {
         if (item.text) {
            value.push(new TextXToken(item.text.str, item));
         }
      } else {
         value.push(item.toXToken());
      }
   }

   return value;
}

/**********************************************************************\
 SToken extraction
\**********************************************************************/

function getSTokens(pToken: LiteralValuePToken) {
   let results: Array<SToken> = [];

   for (let index = 0; index < pToken.length; index++) {
      const item = pToken[index];

      if (!isTextPToken(item)) {
         const typeHack: any = item

         results = results.concat(typeHack.toSTokenArray());
      } else if (item.text) {
         results.push(item.text);
      }
   }

   return results;
}


export {
   LiteralValuePToken,
   LiteralValueXToken,
   Terminators,

   parse,
   checkWellFormed,
   makeXTokenCompatible,
   getSTokens,
}

export default {
   parse,
   checkWellFormed,
   makeXTokenCompatible,
   getSTokens,
};
