/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { SToken, STokenSource } from '../../sToken';

import misc from './misc.js';

const NAMELIST_PTOKEN_TYPE = 'NAMELIST_PTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const PCDATA = '#PCDATA';

type DeliverPToken = (pToken?: NameListPToken) => void;

type NameType = 'NMTOKEN' | 'NAME';
type ListType = 'ENUMERATION' | 'NOTATION' | 'ANY' | 'MIXED';
type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

type ContentParticlePToken = {
   particle?: NamePToken | NameListPToken;
   delimiter?: SToken;
   postDelimiterSpace?: SToken;
};

type NamePToken = {
   name?: SToken;
   postNameSpace?: SToken;
   repeat?: SToken;
   postRepeatSpace?: SToken;
}

class NameListPToken {
   public readonly type: string;
   public open: SToken;
   public postOpenSpace?: SToken;
   public names: Array<ContentParticlePToken>;
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

function isNamePToken(value: any): value is NamePToken {
   if (value && (value.name || value.postNameSpace)) {
      return true;
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
      parseNames(source, namePToken, delimiterType, (pToken: NameListPToken) => {
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

function parseNames(source: STokenSource, pToken: NameListPToken, delimterType: DelimiterType, deliverPToken: DeliverPToken): void {
   source.extract('peekChar', (charSToken: SToken) => {
      if (!charSToken || charSToken.str === '>' || charSToken.str === ')' || charSToken.str === '%') {
         deliverPToken(pToken);
         return;
      }

      const particle: ContentParticlePToken = {};
      let wordDelims = [ ')', '%', '>', '?', '*', '+', '(' ];
   
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
   
      pToken.names.push(particle);

      if (charSToken.str === '(') {
         parse(source, 'ANY', (listPToken: NameListPToken) => {
            particle.particle = listPToken;
            parseDelimiter(source, pToken, particle, delimterType, deliverPToken);
         });
      } else {
         parseName(source, wordDelims, (name: NamePToken) => {
            particle.particle = name;
            parseDelimiter(source, pToken, particle, delimterType, deliverPToken);
         });
      }
   });
}

function parseName(source: STokenSource, wordDelims: Array<string>, deliverName: Function) {
   let namePToken: NamePToken = {};

   source.extractToObject('word', wordDelims, namePToken, 'name');
   source.extractToObject('space', namePToken, 'postNameSpace');
   source.extractToObject('multi', [ '?', '*', '+' ], namePToken, 'repeat');
   source.extractToObject('space', namePToken, 'postRepeatSpace');
   deliverName(namePToken);
}

function parseDelimiter(source: STokenSource, pToken: NameListPToken,  particle: ContentParticlePToken, delimiterType: DelimiterType, deliverPToken: DeliverPToken): void {
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

   source.extractToObject('multi', delimMatch, particle, 'delimiter');
   source.extract('space', (space: SToken) => {
      particle.postDelimiterSpace = space;

      let newDelimiterType: DelimiterType = delimiterType;

      if (particle.delimiter && delimiterType === 'ANY') {
         newDelimiterType = (particle.delimiter.str === ',') ? 'SEQUENCE' :  'CHOICE';
      }

      parseNames(source, pToken, newDelimiterType, deliverPToken);
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
   type: string, listType?: ListType) {
   if (!pToken) {
      return;
   }

   checkListWellFormed(pToken, ec, entityMetaData, type, listType || 'ANY', true);
}

function checkListWellFormed(pToken: NameListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData,
   type: string, listType: ListType, isTop: boolean) {
      let delimType: DelimiterType = (listType === 'ENUMERATION' || listType === 'NOTATION') ? 'CHOICE' : undefined;
      const particleType: NameType = listType === 'ENUMERATION' ? 'NMTOKEN' : 'NAME';

   ec.setPos(pToken.open);
   ec.check(!pToken.open, WFEID.NAMELIST_NO_OPEN);

   ec.setPos(pToken.postOpenSpace);

   if (pToken.names.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.NAMELIST_NO_NAMES, [ type ]);
   }

   for (let index = 0; index < pToken.names.length; index++) {
      const isLast = index === pToken.names.length - 1;
      const entry = pToken.names[index];

      if (isNamePToken(entry.particle)) {
         ec.setPos(entry.particle.name);
         const ucName = entry.particle.name.str.toUpperCase();

         if (index === 0 && listType === 'ANY' && ucName === PCDATA) {
            ec.check(ucName !== entry.particle.name.str, WFEID.NAMELIST_PCDATA_INVALID_CASE, [ entry.particle.name.str ]);
            listType = 'MIXED';
            delimType = 'CHOICE';
         } else {
            if (particleType === 'NMTOKEN') {
               misc.checkNMToken(entry.particle.name, ec, entityMetaData, WFEID.NAMELIST_NAME_INVALID);
            } else {
               misc.checkName(entry.particle.name, ec, entityMetaData, WFEID.NAMELIST_NAME_INVALID);
            }
         }

         ec.setPos(entry.particle.postNameSpace);
         if (entry.particle.repeat) {
            ec.check(entry.particle.postNameSpace, WFEID.NAMELIST_NAME_EXTRA_SPACE, [ index.toString() ]);

            ec.setPos(entry.particle.repeat);

            if (listType === 'MIXED') {
               ec.report(WFEID.NAMELIST_MIXED_NAME_EXTRA_REPEAT, [ index.toString(), entry.particle.repeat.str ]);
            } else if (listType !== 'ANY') {
               ec.report(WFEID.NAMELIST_NAME_EXTRA_REPEAT, [ index.toString(), type, entry.particle.repeat.str ]);
            }
            ec.setPos(entry.particle.postRepeatSpace);
         }
      } else {
         if (entry.particle && entry.particle.open) {
            ec.setPos(entry.particle.open);

            if (listType === 'MIXED') {
               ec.report(WFEID.NAMELIST_MIXED_INVALID_SUBPARTICLE, [ index.toString() ]);
            } else if (listType === 'ENUMERATION' || listType === 'NOTATION') {
               ec.report(WFEID.NAMELIST_INVALID_SUBPARTICLE, [ index.toString(), type ]);
            }

            checkListWellFormed(entry.particle, ec, entityMetaData, type, listType, false);
         } else {
            ec.setPos(undefined);
            ec.check(!entry.particle, WFEID.NAMELIST_NO_NAME, [ index.toString(), type ]);
         }
      }

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
   ec.setPos(pToken.postCloseSpace);

   if (pToken.repeat) {
      ec.check(pToken.postCloseSpace, WFEID.NAMELIST_CLOSE_EXTRA_SPACE);
   }

   ec.setPos(pToken.repeat);
   const repeatStr = misc.textOrBlank(pToken.repeat);
   if (listType === 'MIXED') {
      // 0 length is an "error", but we'll never know that because we identify MIXED by the first item
      if (pToken.names.length === 1) {
         ec.check(repeatStr !== '', WFEID.NAMELIST_MIXED_EXTRA_REPEAT, [ repeatStr ]);
      } else if (pToken.names.length > 1 && repeatStr !== '*') {
         ec.report(WFEID.NAMELIST_MIXED_INVALID_REPEAT, [ repeatStr ]);
      }
   } else if (listType === 'ENUMERATION' || listType === 'NOTATION') {
      ec.check(repeatStr !== '', WFEID.NAMELIST_EXTRA_REPEAT, [ repeatStr, 'xxx' ]);
   }
   ec.setPos(pToken.postRepeatSpace);
}

/**********************************************************************\
 XToken
\**********************************************************************/

type DefinitiveListType = 'CHOICE' | 'SEQUENCE';
type RepeatType = 'ONE' | 'ZEROPLUS' | 'ONEPLUS' | 'ZEROONE';

type XName = {
   name: string;
   repeat: RepeatType;
}

type XNameList = {
   names: Array<XName | XNameList>;
   listType: DefinitiveListType,
   repeat: RepeatType;
};

const REPEAT_LOOKUP_TABLE = {
   '*': 'ZEROPLUS',
   '+': 'ONEPLUS',
   '?': 'ZEROONE',
}

function makeXTokenCompatible(pToken: NameListPToken, lType?: ListType): XNameList {
   const names = [];
   let listType: DefinitiveListType;
   let repetition: RepeatType;
   
   if (lType === 'ENUMERATION' || lType === 'NOTATION') {
      listType = 'CHOICE';
   }

   for (let index = 0; index < pToken.names.length; index++) {
      const particle = pToken.names[index].particle;
      const delimiter = pToken.names[index].delimiter;

      if (!listType && delimiter) {
         listType = (delimiter.str === ',') ? 'SEQUENCE' : 'CHOICE';
      }

      if (!particle) {
         continue;
      }

      if (particle instanceof NameListPToken) {
         names.push(makeXTokenCompatible(particle));
      } else if (particle.name) {
         const name: XName = {
            name: particle.name.str,
            repeat: REPEAT_LOOKUP_TABLE[misc.textOrBlank(particle.repeat)] || 'ONE',
         };

         names.push(name);
      }
   }

   return {
      names,
      listType: listType || 'CHOICE',
      repeat: REPEAT_LOOKUP_TABLE[pToken.repeat && pToken.repeat.str] || 'ONE',
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
