/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { SToken, STokenSource } from '../../sToken';

import misc from './misc.js';

const NAMELIST_PTOKEN_TYPE = 'NAMELIST_PTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

type DeliverPToken = (pToken?: NameListPToken) => void;

type ListType = 'ENUMERATION' | 'NOTATION' | 'ANY';
type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

// Too many permutations here.  some are redundatn
type CWFNameListOptions = {
   nameType?: 'NAME' | 'NMTOKEN';
   listType?: 'CHOICE' | 'SEQUENCE';
   nested?: boolean;
};

type NamePToken = {
   name?: SToken;
   list?: NameListPToken;
   postNameSpace?: SToken;
   delimiter?: SToken;
   postDelimiterSpace?: SToken;
};

class NameListPToken {
   public readonly type: string;
   public open: SToken;
   public postOpenSpace?: SToken;
   public names: Array<NamePToken>;
   public close?: SToken;
   public postCloseSpace?: SToken;
   public repeat?: SToken;
   public postRepeatSpace?: SToken;

   constructor(basePToken?: NameListPToken | object) {
      this.names = [];
      Object.assign(this, basePToken);
      this.type = NAMELIST_PTOKEN_TYPE;
   }
}

/**********************************************************************\
 parse() extracts the STokens for a () enclosed series of word.
 This is used in the various syntax constructions listed below.
 It will stop any time it encounters a % character.

 PARAM
   source: An STokenSource to read from
   deliverPToken: Callback to deliver the PTokens

 SYNTAX
   [58] NotationType   ::= 'NOTATION' S
                           '(' S? Name (S? '|' S? Name)* S? ')'
   [59] Enumeration    ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
   [47] children       ::= (choice | seq) ('?' | '*' | '+')?
   [48] cp             ::= (Name | choice | seq) ('?' | '*' | '+')?
   [49] choice         ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
   [50] seq            ::= '(' S? cp ( S? ',' S? cp )* S? ')'
   [51] Mixed          ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*'
                           | '(' S? '#PCDATA' S? ')'
\**********************************************************************/

function parse(source: STokenSource, listType: ListType, deliverPToken: DeliverPToken): void {
   source.extract('match', '(', (charSToken: SToken) => {
      const namePToken = new NameListPToken();
      if (!charSToken) {
         deliverPToken();
         return;
      }

      namePToken.open = charSToken;
      source.extractToObject('space', namePToken, 'postOpenSpace');

      const delimiterType = (listType === 'ENUMERATION' || listType === 'NOTATION') ? 'CHOICE' : 'ANY';
      extractNames(source, namePToken, listType, delimiterType, (pToken: NameListPToken) => {
         source.extractToObject('match', ')', pToken, 'close');
         source.extractToObject('space', pToken, 'postCloseSpace');
         source.extractToObject('multi', [ '?', '*', '+' ], pToken, 'repeat');
         source.extract('space', (spaceSToken: SToken) => {
            pToken.postRepeatSpace = spaceSToken;

            deliverPToken(pToken);
         });
      });
   });
}

function extractNames(source: STokenSource, pToken: NameListPToken, listType: ListType, delimterType: DelimiterType, deliverPToken: DeliverPToken): void {
   source.extract('peekChar', (charSToken: SToken) => {
      if (!charSToken || charSToken.str === '>' || charSToken.str === ')' || charSToken.str === '%') {
         deliverPToken(pToken);
         return;
      }

      const entry: NamePToken = {};
      let wordDelims = [ ')', '%', '>'];
   
      switch (delimterType) {
         case 'CHOICE':
            wordDelims.unshift('|');
            break;
         case 'SEQUENCE':
            wordDelims.unshift(',');
            break;
         default:
            wordDelims.unshift(',');
            wordDelims.unshift('|');
            break;
      }
   
      pToken.names.push(entry);

      if (listType === 'ANY') {
         wordDelims.push('(');

         if (charSToken.str === '(') {
            parse(source, 'ANY', (listPToken: NameListPToken) => {
               entry.list = listPToken;
               getDelimiter(source, pToken, entry, listType, delimterType, deliverPToken);
            });
            return;
         }
      };

      source.extractToObject('word', wordDelims, entry, 'name');
      getDelimiter(source, pToken, entry, listType, delimterType, deliverPToken);
   });
}

function getDelimiter(source: STokenSource, pToken: NameListPToken,  entry: NamePToken, listType: ListType, delimiterType: DelimiterType, deliverPToken: DeliverPToken): void {
   let delimMatch;

   switch (delimiterType) {
      case 'CHOICE':
         delimMatch = [ '|' ];
         break;
      case 'SEQUENCE':
         delimMatch = [ ',' ];
         break;
      default:
         delimMatch = [ '|', ',' ];
         break;
   }

   source.extractToObject('space', entry, 'postNameSpace');
   source.extractToObject('multi', delimMatch, entry, 'delimiter');
   source.extract('space', (space: SToken) => {
      entry.postDelimiterSpace = space;

      let newDelimiterType: DelimiterType = delimiterType;

      if (entry.delimiter && delimiterType === 'ANY') {
         newDelimiterType = (entry.delimiter.str === ',') ? 'SEQUENCE' :  'CHOICE';
      }

      extractNames(source, pToken, listType, newDelimiterType, deliverPToken);
   });

}

/**********************************************************************\
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function assignUnassigned(attLiPToken) {
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: NameListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData,
   type: string, options: CWFNameListOptions = {}) {
   if (!pToken) {
      return;
   }
   let delimType = options.listType;

   ec.setPos(pToken.open);
   ec.setPos(pToken.postOpenSpace);

   if (pToken.names.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.NAMELIST_NO_NAMES, [ type ]);
   }

   for (let index = 0; index < pToken.names.length; index++) {
      const isLast = index === pToken.names.length - 1;
      const entry = pToken.names[index];

      ec.setPos(entry.name);
      ec.check(!entry.name, WFEID.NAMELIST_NO_NAME, [ index.toString(), type ]);
      if (options.nameType === 'NMTOKEN') {
         misc.checkNmToken(entry.name, ec, entityMetaData, WFEID.NAMELIST_NAME_INVALID);
      } else {
         misc.checkName(entry.name, ec, entityMetaData, WFEID.NAMELIST_NAME_INVALID);
      }

      ec.setPos(entry.postNameSpace);
      ec.setPos(entry.delimiter);

      if (entry.delimiter) {
         if (!delimType) {
            delimType = entry.delimiter.str === ',' ? 'SEQUENCE' : 'CHOICE';
         }

         if (delimType === 'SEQUENCE' && entry.delimiter.str !== ',') {
            ec.report(WFEID.NAMELIST_BAD_SEQUENCE, [ index.toString(), type, entry.delimiter.str]);
         } else if (entry.delimiter.str !== '|') {
            ec.report(WFEID.NAMELIST_BAD_CHOICE, [ index.toString(), type, entry.delimiter.str]);
         }
      }

      if (!isLast) {
         ec.check(!entry.delimiter, WFEID.NAMELIST_NO_DELIM, [ index.toString(), type ]);
      } else {
         ec.check(entry.delimiter, WFEID.NAMELIST_EXTRA_DELIM, [ index.toString(), type ]);
      }

      ec.setPos(entry.postDelimiterSpace);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NAMELIST_NO_CLOSE, [ type ]);
}

/**********************************************************************\
 XToken
\**********************************************************************/

type XNames = {
   names: Array<string>;
   listType: 'CHOICE' | 'SEQUENCE',
};

function makeXTokenCompatible(pToken: NameListPToken, options: CWFNameListOptions = {}): XNames {
   const names = [];
   let listType = options.listType;

   for (let index = 0; index < pToken.names.length; index++) {
      const name = pToken.names[index].name;
      const type = pToken.names[index].delimiter;

      if (!listType && type) {
         listType = (type.str === ',') ? 'SEQUENCE' : 'CHOICE';
      }

      if (!name) {
         continue;
      }

      names.push(name.str);
   }

   return {
      names,
      listType: listType || 'CHOICE',
   };
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

const nameList = {
   PTYPE: NAMELIST_PTOKEN_TYPE,
   PToken: NameListPToken,
   NameListPToken,

   parse,
   assignUnassigned,
   checkWellFormed,
   makeXTokenCompatible,
};

export default nameList;
