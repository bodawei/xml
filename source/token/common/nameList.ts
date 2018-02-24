/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { SToken, STokenSource } from '../../sToken';

import misc from './misc.js';

const NAMELIST_PTOKEN_TYPE = 'NAMELIST_PTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

type DeliverPToken = (pToken?: NameListPToken) => void;

type NamePToken = {
   name?: SToken;
   postNameSpace?: SToken;
   or?: SToken;
   postOrSpace?: SToken;
};

class NameListPToken {
   public readonly type: string;
   public open: SToken;
   public postOpenSpace?: SToken;
   public names: Array<NamePToken>;
   public close?: SToken;

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

\**********************************************************************/

function parse(source: STokenSource, deliverPToken: DeliverPToken): void {
   source.extract('match', '(', (charSToken: SToken) => {
      const namePToken = new NameListPToken();
      if (!charSToken) {
         deliverPToken();
         return;
      }

      namePToken.open = charSToken;
      source.extractToObject('space', namePToken, 'postOpenSpace');

      extractNames(source, namePToken, (pToken: NameListPToken) => {
         source.extract('match', ')', (charSToken: SToken) => {
            pToken.close = charSToken;

            deliverPToken(pToken);
         });
      });
   });
}

function extractNames(source: STokenSource, pToken: NameListPToken, deliverPToken: DeliverPToken): void {
   const entry: NamePToken = {};

   source.extractToObject('word', [ '|', ')', '%', '>'], entry, 'name');
   source.extractToObject('space', entry, 'postNameSpace');
   source.extractToObject('match', '|', entry, 'or');
   source.extractToObject('space', entry, 'postOrSpace');

   source.extract('peekChar', (charSToken: SToken) => {
      if (entry.name || entry.or) {
         pToken.names.push(entry);
      }

      if (!charSToken || charSToken.str === '>' || charSToken.str === ')' || charSToken.str === '%') {
         deliverPToken(pToken);
         return;
      }

      extractNames(source, pToken, deliverPToken);
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

function checkWellFormed(pToken: NameListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData, type: string) {
   if (!pToken) {
      return;
   }

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
      misc.checkName(entry.name, ec, entityMetaData, WFEID.NAMELIST_NAME_INVALID);

      ec.setPos(entry.postNameSpace);
      ec.setPos(entry.or);

      if (!isLast) {
         ec.check(!entry.or, WFEID.NAMELIST_NO_OR, [ index.toString(), type ]);
      } else {
         ec.check(entry.or, WFEID.NAMELIST_EXTRA_OR, [ index.toString(), type ]);
      }

      ec.setPos(entry.postOrSpace);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NAMELIST_NO_CLOSE, [ type ]);
}

/**********************************************************************\
 XToken
\**********************************************************************/

type XNames = {
   names: Array<string>;
};

function makeXTokenCompatible(pToken: NameListPToken): XNames {
   const names = [];

   for (let index = 0; index < pToken.names.length; index++) {
      const name = pToken.names[index].name;
      if (!name) {
         continue;
      }

      names.push(name.str);
   }

   return {
      names,
   };
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

const attListDecl = {
   PTYPE: NAMELIST_PTOKEN_TYPE,
   PToken: NameListPToken,

   parse,
   assignUnassigned,
   checkWellFormed,
   makeXTokenCompatible,
};

export default attListDecl;






/*
M 138 basic Parse (mode: choiceOnly|any)
choiceOnly
   ( S
   Array of name S | S
   )
any
   allows  Array of name S , S
   adds occurrence char
   Auto-discovers type based on first delimiter
   If find #PCDATA in first, constraints to only | and * at end
M 139 Wellformed: option name or nameToken
- checks type of each item
not a trailing | ,
not a missing name 
not a missing | ,
has a )
trailing char is one of the allowed
not find #PCDATA in non-first place
if find non-cap #pcdata
S 140 XTokenCompatible
xToken is:
type NameList = {
   type: nameList
   choicetype: sequence|pickOne
   names: Array<string|NameList>,
   occurrence: one|zeroOne|onePlus|zeroPlus
}

*/