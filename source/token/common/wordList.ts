/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource, STokenArrayBuilder } from 'sToken';

const ENUMERATION_PTOKEN = 'ENUMERATION_PTOKEN';
const NOTATION_PTOKEN = 'NOTATION_PTOKEN';

type WORDLIST_PTOKEN = typeof ENUMERATION_PTOKEN | typeof NOTATION_PTOKEN;
type DeliverPToken = (pToken?: WordListPToken) => void;
type DeliverNamePToken = (pToken: Array<WordListEntryPToken>) => void;
enum WordListType {
    ENUMERATION = 'ENUMERATION',
    NOTATION = 'NOTATION',
};
type WordListProps = {
   open: SToken;
   [name: string]: any;
};

// At least one property in this will always be defined by parse()
type WordListEntryPToken = {
   readonly word?: SToken;
   readonly wordSpace?: SToken;
   readonly connector?: SToken;
   readonly connectorSpace?: SToken;
}

class WordListPToken {
   public readonly type: WORDLIST_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly words: Array<WordListEntryPToken> = [];
   public readonly close?: SToken;
   public readonly closeSpace?: SToken;

   constructor(type: WordListType, props: WordListPToken | WordListProps, otherProps?: Object) {
      Object.assign(this, props, otherProps || {});

      this.type = type === WordListType.NOTATION ? NOTATION_PTOKEN : ENUMERATION_PTOKEN;
      this.open = props.open; // Convince compiler that there is an open
      this.words = this.words || [];
   }

   toSTokenArray(): Array<SToken> {
      return toSTokenArray(this);
   }
}

/**********************************************************************\
 parse() extracts the STokens for a () enclosed series of words
 separated by connectors (|'s) in an ATTLIST

 PARAM
   source: An STokenSource to read from
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   §3.3.1
   [58] NotationType   ::= ... '(' S? Name (S? '|' S? Name)* S? ')'
   [59] Enumeration    ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'

   Lax: [58] NotationType   ::= ... '(' S? (Name? S? '|'? S?)+ ')'?
        [59] Enumeration    ::= '(' S? (Nmtoken? S? '|'? S?)+ S? ')'?
\**********************************************************************/

function parse(source: STokenSource, type: WordListType, deliverPToken: DeliverPToken): void {
   source.extract('match', '(', (charSToken) => {
      if (!charSToken) {
         deliverPToken();
         return;
      }

      const wlProps: WordListProps = { open: charSToken };
      source.extractToObjectNoParams('space', wlProps, 'openSpace');

      parseNames(source, (pToken) => {
         wlProps.words = pToken;
         source.extractToObject('match', ')', wlProps, 'close');
         source.extractNoParams('space', (spaceSToken?) => {
            wlProps.closeSpace = spaceSToken;

            deliverPToken(new WordListPToken(type, wlProps));
         });
      });
   });
}

function parseNames(source: STokenSource, deliverPToken: DeliverNamePToken): void {
   source.extractNoParams('peekChar', (charSToken) => {
      if (!charSToken || charSToken.str === ')' || charSToken.str === '%' || charSToken.str === '>') {
         deliverPToken([]);
         return;
      }

      let aWord = {};

      // Codi will always match at least one of these.
      source.extractToObject('word', [ ')', '%', '>', '|' ], aWord, 'word');
      source.extractToObjectNoParams('space', aWord, 'wordSpace');
      source.extractToObject('match', '|', aWord, 'connector');
      source.extractToObjectNoParams('space', aWord, 'connectorSpace');
      parseNames(source, (result) => {
         result.unshift(aWord);
         deliverPToken(result);
      });
   });
}


/**********************************************************************\
 STokenArray
\**********************************************************************/

function toSTokenArray(pToken: WordListPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace);

   for (const entry of pToken.words) {
      builder.add(entry.word, entry.wordSpace, entry.connector, entry.connectorSpace);
   }

   builder.add(pToken.close, pToken.closeSpace);

   return builder.sTokenArray;
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

export {
   parse as parseWordList,

   ENUMERATION_PTOKEN,
   NOTATION_PTOKEN,
   WordListType,
   WordListPToken,

   WordListEntryPToken,
};
