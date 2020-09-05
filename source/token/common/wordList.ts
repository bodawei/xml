/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import misc from './misc';

const ENUMERATION_PTOKEN = 'ENUMERATION_PTOKEN';
const NOTATION_PTOKEN = 'NOTATION_PTOKEN';
const WFEID = WellFormedError.ID;

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

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion):void {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken(): WordListXToken {
      return makeXTokenCompatible(this);
   }

   toSTokenArray(): Array<SToken> {
      return toSTokenArray(this);
   }
}

type WordListXToken = Array<string>;

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
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: WordListPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);

   if (pToken.words.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.WORDLIST_NO_WORDS);
   }

   let index = 0;
   for (const entry of pToken.words) {
      const isLast = index === pToken.words.length - 1;

      ec.setPos(entry.word);
      ec.check(!entry.word, WFEID.WORDLIST_NO_WORD, [ index.toString() ]);

      if (pToken.type === ENUMERATION_PTOKEN) {
         misc.checkNMToken(entry.word, ec, confVer, WFEID.WORDLIST_INVALID_NMTOKEN);
      } else {
         misc.checkName(entry.word, ec, confVer, WFEID.WORDLIST_INVALID_NAME);
      }

      ec.setPos(entry.wordSpace);
      ec.setPos(entry.connector);

      if (isLast) {
         ec.check(entry.connector, WFEID.WORDLIST_NO_WORD, [ (index + 1).toString() ]);
      } else {
         ec.check(!entry.connector, WFEID.WORDLIST_NO_CONNECTOR, [ index.toString() ]);
      }

      ec.setPos(entry.connectorSpace);

      index++;
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.WORDLIST_NO_CLOSE);
}

/**********************************************************************\
 XToken
\**********************************************************************/

function makeXTokenCompatible(pToken: WordListPToken): WordListXToken {
   const words: WordListXToken = [];

   for (const word of pToken.words) {
      if (word.word) {
         words.push(word.word.str);
      }
   }

   return words;
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
   WordListXToken,

   WordListEntryPToken,
};
