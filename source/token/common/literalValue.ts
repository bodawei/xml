/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic/index';
import { ErrorCollector } from '../../error/index';
import { SToken, STokenSource } from '../../sToken';

import entityReference, { EntityReferencePToken, EntityReferenceXToken } from '../entityReference';
import text, { TextPToken, TextXToken } from '../text';
import misc from './misc.js';

// <typeHack>
   // type EntityReferencePToken = { type: string };
   function isTextPToken(item: any): item is TextPToken {
      return item.type === text.PTYPE;
   }
// </typeHack>

type Terminators = Array<'&'|'%'|'"'|'\''>;
type LiteralValuePToken = Array<TextPToken|EntityReferencePToken>;
type LiteralValueXToken = Array<TextXToken|EntityReferenceXToken>;
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
         currentValue = [ new text.PToken({ text: container.sToken }) ];
      }

      // End of file.
      if (!charSToken) {
         deliverPToken(currentValue);
         return;
      }

      function handleRef(refPToken: EntityReferencePToken) {
         parse(source, terminators, (rest) => {
            rest.unshift(refPToken);
            deliverPToken(currentValue.concat(rest));
         });
      }

      switch (charSToken.str[0]) {
         case '"': // Note Cody will only notice one of these (the one passed in through terminators)
         case '\'':
            deliverPToken(currentValue);
            break;
         case '%':
            entityReference.paramParse(source, handleRef);
            break;
         case '&':
            source.extractNoParams('char', (opening) => {
               entityReference.parse(source, opening!, handleRef); // typeHack
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
      } else {
         entityReference.checkWellFormed(item, ec, entityMetaData);
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
            value.push(new text.XToken(item.text.str, item));
         }
      } else {
         value.push(entityReference.pTokenToXToken(item));
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

         results = results.concat(typeHack.getSTokenArray());
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
