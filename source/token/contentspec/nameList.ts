/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import base from '../base';

import { Graph } from './nameListGraphTypes';
import nameListGraph from './nameListGraph';
import misc from '../common/misc';

const NAMELIST_PTOKEN_TYPE = 'NAMELIST_PTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const PCDATA = '#PCDATA';

type DeliverPToken = (pToken?: NameListPToken) => void;
type InnerDeliverPToken = (pToken: NameListPToken) => void;

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

class NameListPToken extends base.PToken {
   public open?: SToken;
   public postOpenSpace?: SToken;
   public names: Array<ContentParticlePToken>;
   public close?: SToken;
   public postCloseSpace?: SToken;
   public repeat?: SToken;
   public postRepeatSpace?: SToken;

   constructor(props?: NameListPToken|Object) {
      super(NAMELIST_PTOKEN_TYPE, props);
      this.names = (props && 'names' in props) ? props.names : [];
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(
         this.open,
         this.postOpenSpace,
      );

      for (let index = 0; index < this.names.length; index++) {
         let cp = this.names[index];

         if (cp.particle instanceof NameListPToken) {
            results.pushSTokens(...cp.particle.getSTokenArray());
         } else {
            results.pushSTokens(
               cp.particle!.name,
               cp.particle!.postNameSpace,
               cp.particle!.repeat,
               cp.particle!.postRepeatSpace,
            );
         }

         results.pushSTokens(
            cp.delimiter,
            cp.postDelimiterSpace,
         );
      }

      results.pushSTokens(
         this.close,
         this.postCloseSpace,
         this.repeat,
         this.postRepeatSpace,
      );

      return results;
   }
}

function isNamePToken(value: any): value is NamePToken {
   return value && (value.name || value.postNameSpace);
}

/**********************************************************************\
 parse() extracts the STokens for a () enclosed series of word.
 This is used in the various syntax constructions listed below.
 It will stop any time it encounters a % character.

 PARAM
   source: An STokenSource to read from
   deliverPToken: Callback to deliver the PTokens

 SYNTAX
   §3.2.1
   [47] children       ::= (choice | seq) ('?' | '*' | '+')?
   [48] cp             ::= (Name | choice | seq) ('?' | '*' | '+')?
   [49] choice         ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
   [50] seq            ::= '(' S? cp ( S? ',' S? cp )* S? ')'
   §3.2.2
   [51] Mixed          ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*'
                           | '(' S? '#PCDATA' S? ')'
\**********************************************************************/

function parse(source: STokenSource, deliverPToken: DeliverPToken): void {
   source.extract('match', '(', (charSToken) => {
      const namePToken = new NameListPToken();
      if (!charSToken) {
         deliverPToken();
         return;
      }

      namePToken.open = charSToken;
      source.extractToObjectNoParams('space', namePToken, 'postOpenSpace');

      parseNames(source, namePToken, 'ANY', (pToken: NameListPToken) => {
         source.extractToObject('match', ')', pToken, 'close');
         source.extractToObjectNoParams('space', pToken, 'postCloseSpace');
         source.extractToObject('multi', [ '?', '*', '+' ], pToken, 'repeat');
         source.extractNoParams('space', (spaceSToken?) => {
            pToken.postRepeatSpace = spaceSToken;

            deliverPToken(pToken);
         });
      });
   });
}

function parseNames(source: STokenSource, pToken: NameListPToken, delimterType: DelimiterType, deliverPToken: InnerDeliverPToken): void {
   source.extractNoParams('peekChar', (charSToken) => {
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
         parse(source, (listPToken?: NameListPToken) => {
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
   source.extractToObjectNoParams('space', namePToken, 'postNameSpace');
   source.extractToObject('multi', [ '?', '*', '+' ], namePToken, 'repeat');
   source.extractToObjectNoParams('space', namePToken, 'postRepeatSpace');
   deliverName(namePToken);
}

function parseDelimiter(source: STokenSource, pToken: NameListPToken,  particle: ContentParticlePToken, delimiterType: DelimiterType, deliverPToken: InnerDeliverPToken): void {
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
   source.extractNoParams('space', (space) => {
      particle.postDelimiterSpace = space;

      let newDelimiterType: DelimiterType = delimiterType;

      if (particle.delimiter && delimiterType === 'ANY') {
         newDelimiterType = (particle.delimiter.str === ',') ? 'SEQUENCE' :  'CHOICE';
      }

      parseNames(source, pToken, newDelimiterType, deliverPToken);
   });

}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: NameListPToken | void, ec: ErrorCollector, confVer: ConformanceVersion) {
   if (!pToken) {
      return;
   }

   checkListWellFormed(pToken, ec, confVer);
}

function checkListWellFormed(pToken: NameListPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   let delimType: DelimiterType | void = undefined;
   let isMixedType = false;

   ec.setPos(pToken.open);
   ec.check(!pToken.open, WFEID.NAMELIST_NO_OPEN);

   ec.setPos(pToken.postOpenSpace);

   if (pToken.names.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.NAMELIST_NO_NAMES);
   }

   for (let index = 0; index < pToken.names.length; index++) {
      const isLast = index === pToken.names.length - 1;
      const entry = pToken.names[index];

      if (isNamePToken(entry.particle)) {
         ec.setPos(entry.particle.name);
         const namePTokenName = strOrBlank(entry.particle.name);
         const ucName = namePTokenName.toUpperCase();

         if (index === 0 && !isMixedType && ucName === PCDATA) {
            ec.check(ucName !== namePTokenName, WFEID.NAMELIST_PCDATA_INVALID_CASE, [ namePTokenName ]);
            isMixedType = true;
            delimType = 'CHOICE';
         } else {
            misc.checkName(entry.particle.name, ec, confVer, WFEID.NAMELIST_NAME_INVALID);
         }

         ec.setPos(entry.particle.postNameSpace);
         if (entry.particle.repeat) {
            ec.check(entry.particle.postNameSpace, WFEID.NAMELIST_NAME_EXTRA_SPACE, [ index.toString() ]);

            ec.setPos(entry.particle.repeat);

            if (isMixedType) {
               ec.report(WFEID.NAMELIST_MIXED_NAME_EXTRA_REPEAT, [ index.toString(), entry.particle.repeat.str ]);
            }
            ec.setPos(entry.particle.postRepeatSpace);
         }
      } else {
         if (entry.particle && entry.particle.open) {
            ec.setPos(entry.particle.open);

            if (isMixedType) {
               ec.report(WFEID.NAMELIST_MIXED_INVALID_SUBPARTICLE, [ index.toString() ]);
            }

            checkListWellFormed(entry.particle, ec, confVer);
         } else {
            ec.setPos(undefined);
            ec.check(!entry.particle || !entry.particle.name, WFEID.NAMELIST_NO_NAME, [ index.toString() ]);
         }
      }

      ec.setPos(entry.delimiter);

      if (entry.delimiter) {
         if (!delimType) {
            delimType = entry.delimiter.str === ',' ? 'SEQUENCE' : 'CHOICE';
         }

         if (delimType === 'SEQUENCE') {
            if (entry.delimiter.str !== ',') {
               ec.report(WFEID.NAMELIST_BAD_SEQUENCE, [ index.toString(), entry.delimiter.str]);
            }
         } else if (entry.delimiter.str !== '|') {
            ec.report(WFEID.NAMELIST_BAD_CHOICE, [ index.toString(), entry.delimiter.str]);
         }
      }

      if (!isLast) {
         ec.check(!entry.delimiter, WFEID.NAMELIST_NO_DELIM, [ index.toString() ]);
      } else {
         ec.check(entry.delimiter, WFEID.NAMELIST_EXTRA_DELIM, [ index.toString() ]);
      }

      ec.setPos(entry.postDelimiterSpace);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NAMELIST_NO_CLOSE);
   ec.setPos(pToken.postCloseSpace);

   if (pToken.repeat) {
      ec.check(pToken.postCloseSpace, WFEID.NAMELIST_CLOSE_EXTRA_SPACE);
   }

   ec.setPos(pToken.repeat);
   const repeatStr = strOrBlank(pToken.repeat);
   if (isMixedType) {
      // 0 length is an "error", but we'll never know that because we identify MIXED by the first item
      // valid/P68/ibm68v02.xml and kin drew attention to the fact that this is actually ok.
      // if (pToken.names.length === 1) {
      //    ec.check(repeatStr !== '', WFEID.NAMELIST_MIXED_EXTRA_REPEAT, [ repeatStr ]);
      // } else
      if (pToken.names.length > 1 && repeatStr !== '*') {
         ec.report(WFEID.NAMELIST_MIXED_INVALID_REPEAT, [ repeatStr ]);
      }
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

const REPEAT_LOOKUP_TABLE: { [key: string]: RepeatType } = {
   '*': 'ZEROPLUS',
   '+': 'ONEPLUS',
   '?': 'ZEROONE',
}

function isXName(value: any): value is XName {
   return value && value.name;
}

function makeXTokenCompatible(pToken: NameListPToken): XNameList {
   const names = [];
   let listType: DefinitiveListType | void;

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
            repeat: REPEAT_LOOKUP_TABLE[strOrBlank(particle.repeat)] || 'ONE',
         };

         names.push(name);
      }
   }

   const index = pToken.repeat ? pToken.repeat.str : '';
   return {
      names,
      listType: listType || 'CHOICE',
      repeat: REPEAT_LOOKUP_TABLE[index] || 'ONE',
   };
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

function graphFromNameList(children: XNameList): Graph {
   const graph = nameListGraph.nameListToGraph(children);
   nameListGraph.collapseAutoTrans(graph);
   nameListGraph.pruneNameListGraph(graph);

   return graph;
}

const nameList = {
   PTYPE: NAMELIST_PTOKEN_TYPE,
   PToken: NameListPToken,
   NameListPToken,

   parse,
   checkWellFormed,
   makeXTokenCompatible,

   graphFromNameList,

   isNamePToken,
   isXName,
};

export default nameList;
export {
   ContentParticlePToken,
   NamePToken,
   NameListPToken,
   XNameList,
   XName,
   isXName,
};