/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic/index';
import { ErrorCollector, WellFormedError } from '../../error/index';
import { SToken, STokenSource, STokenArrayBuilder } from '../../sToken/index';
import unassigned, { DescriptorArray, UnassignedArray } from '../unassigned';

import misc from './misc.js';

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

   checkWellFormed(ec: ErrorCollector, emd: EntityMetaData):void {
      return checkWellFormed(this, ec, emd);
   }

   toXToken(): WordListXToken {
      return makeXTokenCompatible(this);
   }

   toSTokenArray(): Array<SToken> {
      return toSTokenArray(this);
   }

   newWithUnassigned(unassigned: UnassignedArray): WordListPToken {
      assignUnassigned(this, unassigned);
      return this;
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
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function newWordListFromUndefined(type: WordListType, unValues: UnassignedArray) {
   const list = new WordListPToken(type, { open: SToken.fromString('('), });
   (list as any).open = undefined;

   assignUnassigned(list, unValues);

   return list;
}

function assignUnassigned(wlPToken: WordListPToken, unValues: UnassignedArray) {
   if (unValues.length === 0) {
      return;
   }

   const unexpandedRef = unValues.filter((item: any) => (item.type === 'reference'));

   if (unexpandedRef.length !== 0) {
      return;
   }

   assignListOpen(wlPToken, unValues);
   assignNames(wlPToken, unValues);
   assignListClose(wlPToken, unValues);
}

// Try to fill in the : '(' S?
function assignListOpen(wlPToken: WordListPToken, unValues: UnassignedArray) {
   let openDescriptors: DescriptorArray = [];
   let startProp;

   if (wlPToken.words.length > 0 || wlPToken.close) {
      return;
   }

   if (!wlPToken.open) {
      openDescriptors.push({ name: 'open', type: 'word', allowed: /\(/ });
      startProp = 'open';
   }

   if (!wlPToken.openSpace) {
      openDescriptors.push({ name: 'openSpace', type: 'space' });
      startProp = startProp || 'openSpace';
   }

   if (startProp) {
      unassigned.assignToProps(unValues, wlPToken, startProp, openDescriptors);
   }
}

function assignNames(wlPToken: WordListPToken, unValues: UnassignedArray) {
   if (wlPToken.close || wlPToken.closeSpace) {
      return;
   }

   let words: Array<WordListEntryPToken> = wlPToken.words;
   let mode = words.length === 0 ? 'firstWord' : 'partialWord';
   let nextUnValue = unValues[0];

   while (nextUnValue) {
      let wordEntry: WordListEntryPToken = {
         word: undefined,
         wordSpace: undefined,
         connector: undefined,
         connectorSpace: undefined,
      };
      const descriptors: DescriptorArray = [];
      let startProp;

      if (nextUnValue.type === 'literal' ||
         (nextUnValue.type === 'word' && nextUnValue.token.text && nextUnValue.token.text.str === ')')) {
         return;
      }

      switch(mode) {
         case 'firstWord':
            unassigned.assignToProps(unValues, wlPToken, 'openSpace', [
               { name: 'openSpace', type: 'space' } ]);
            break;
         case 'partialWord':
            wordEntry = words[words.length - 1];
            // We'll re-insert it below.
            words.pop();
            break;
         default:
            // Deal with any leading spaces in the unValues, before turning to the next word
            const lastEntry = words[words.length - 1];
            const lastSpace = lastEntry.connector ? 'connectorSpace' : 'wordSpace';
            unassigned.assignToProps(unValues, lastEntry, lastSpace, [
               { name: lastSpace, type: 'space' } ]);
            break;
      }

      mode = 'defaultNewWord';
      startProp = 'connectorSpace';
      descriptors.push({ name: 'connectorSpace', type: 'space' });
   
      if (!wordEntry.connector) {
         // Will that match .*|.* ?
         descriptors.unshift({ name: 'connector', type: 'word', allowed: /\|/ });
         startProp = 'connector';
   
         if (!wordEntry.wordSpace) {
            descriptors.unshift({ name: 'wordSpace', type: 'space'});
            startProp = 'wordSpace';
      
            if (!wordEntry.word) {
               descriptors.unshift({ name: 'word', type: 'word', allowed: /[^\)\|]/ });
               startProp = 'word';
            }
         }
      }

      unassigned.assignToProps(unValues, wordEntry, startProp, descriptors);

      words.push(wordEntry);
      nextUnValue = unValues[0];
   }
}

function assignListClose(wlPToken: WordListPToken, unValues: Array<any>) {
   const words = wlPToken.words;
   const closeDescriptors: DescriptorArray = [];
   const hasWords = words.length > 0;
   let closeProp;

   /*
    * In case the first unValue is a space, attach it to:
    *    the openSpace if we have no ( and no words
    *    the last word (if any) after word or connector, or
    *    otherwise the closeSpace
    */
   if (!wlPToken.close) {
      if (!hasWords) {
         closeDescriptors.push({ name: 'openSpace', type: 'space' });
         closeProp = 'openSpace';
      } else {
         const lastEntry = words[words.length - 1];
         const lastSpace = lastEntry.connector ? 'connectorSpace' : 'wordSpace';
   
         unassigned.assignToProps(unValues, lastEntry, lastSpace,
            [{ name: lastSpace, type: 'space' }]);
      }

      closeDescriptors.push({ name: 'close', type: 'word', allowed: /\)/ });
      closeProp = closeProp || 'close';
   }

   closeDescriptors.push({ name: 'closeSpace', type: 'space' });
   closeProp = closeProp || 'closeSpace';

   unassigned.assignToProps(unValues, wlPToken, closeProp, closeDescriptors);
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: WordListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
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
         misc.checkNMToken(entry.word, ec, entityMetaData, WFEID.WORDLIST_INVALID_NMTOKEN);
      } else {
         misc.checkName(entry.word, ec, entityMetaData, WFEID.WORDLIST_INVALID_NAME);
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
   newWordListFromUndefined,

   ENUMERATION_PTOKEN,
   NOTATION_PTOKEN,
   WordListType,
   WordListPToken,
   WordListXToken,
};
