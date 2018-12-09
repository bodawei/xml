/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from '../sToken';

const CHARREF_PTOKEN_TYPE = 'CHARREF_PTOKEN';
const CHARREF_XTOKEN_TYPE = 'CHARREF_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken?: CharRefPToken) => void;

class CharRefPToken {
   public readonly type: string = CHARREF_PTOKEN_TYPE;
   public open: SToken;
   public postOpenSpace?: SToken;
   public hexMarker?: SToken;
   public postHexMarkerSpace?: SToken;
   public digits?: SToken;
   public postDigitsSpace?: SToken;
   public close?: SToken;
   public charCode?: number;

   constructor(basePToken: CharRefPToken | { open: SToken, [ other: string ]: any } | SToken) {
      if (basePToken instanceof SToken) {
         this.open = basePToken;
         return;
      }

      Object.assign(this, basePToken);

      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData) {
      return checkWellFormed(this, ec, entityMetaData);
   }

   toXToken() {
      return pTokenToXToken(this);
   }
}

class CharRefXToken {
   public readonly type: string = CHARREF_XTOKEN_TYPE;
   public readonly char: string;
   public readonly pToken?: CharRefPToken;

   constructor(character: string, pToken?: CharRefPToken) {
      this.char = character;
      this.pToken = pToken;
   }
}

/**********************************************************************\
 parse() extracts the STokens for a character reference

 PARAM
   source: An STokenSource to read from
   openSToken: The opening '&#' SToken
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   § 4.1.0
   [66]  CharRef ::= '&#' [0-9]+ ';' |
                     '&#x' [0-9a-fA-F]+ ';' [ WFC: Legal Character ]
    Lax: CharRef ::= '&#' S? [0-9]+ S? ';' |
                     '&#' S? [xX] S? [0-9a-fA-F]+ S? ';'
\**********************************************************************/

function parse(source: STokenSource, openSToken: SToken, deliverPToken: DeliverPToken): void {
   const pToken = new CharRefPToken(openSToken);

   source.extractToObjectNoParams('space', pToken, 'postOpenSpace');
   source.extract('multi', ['x', 'X'], (hexMarker) => {
      if (hexMarker) {
         pToken.hexMarker = hexMarker;
      }

      source.extractToObjectNoParams('space', pToken, 'postHexMarkerSpace');
      source.extractToObject('digit', hexMarker ? 16 : 10, pToken, 'digits');
      source.extractToObjectNoParams('space', pToken, 'postDigitsSpace');

      source.extract('match', ';', (closeSToken) => {
         pToken.close = closeSToken;

         deliverPToken(pToken);
      });
   });
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: CharRefPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken) {
      return;
   }

   ec.setPos(pToken.open);

   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.CHARREF_XTRA_POST_OPEN_SPACE);

   ec.setPos(pToken.hexMarker);
   ec.check(pToken.hexMarker && pToken.hexMarker.str !== pToken.hexMarker.str.toLowerCase(),
      WFEID.CHARREF_INVALID_HEX_CASE);

   ec.setPos(pToken.postHexMarkerSpace);
   ec.check(pToken.postHexMarkerSpace, WFEID.CHARREF_XTRA_POST_HEX_SPACE);

   ec.setPos(pToken.digits);
   ec.check(!pToken.digits, WFEID.CHARREF_NO_DIGITS);

   ec.setPos(pToken.postDigitsSpace);
   ec.check(pToken.postDigitsSpace, WFEID.CHARREF_XTRA_POST_DIGITS_SPACE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CHARREF_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken
\**********************************************************************/

function pTokenToXToken(pToken: CharRefPToken): CharRefXToken {
   let character = ' ';

   if (pToken.digits) {
      let charNumber;

      if (pToken.hexMarker) {
         charNumber = parseInt(pToken.digits.str, 16);
      } else {
         charNumber = parseInt(pToken.digits.str, 10);
      }

      character = String.fromCharCode(charNumber);
   }


   return new CharRefXToken(character, pToken);
}


/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: CharRefPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.postOpenSpace,
      pToken.hexMarker,
      pToken.postHexMarkerSpace,
      pToken.digits,
      pToken.postDigitsSpace,
      pToken.close);

      return builder.sTokenArray;
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

export {
   CHARREF_PTOKEN_TYPE as PTYPE,
   CHARREF_XTOKEN_TYPE as XTYPE,
   CharRefPToken,
   CharRefXToken,

   parse,
   checkWellFormed,
   pTokenToXToken,
   sTokensFromPToken,

   CHARREF_PTOKEN_TYPE,
};
