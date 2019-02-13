/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from '../sToken';

const CHARREF_PTOKEN = 'CHARREF_PTOKEN';
const CHARREF_XTOKEN = 'CHARREF_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken?: CharRefPToken) => void;
type PreToken = { open: SToken, [ other: string ]: any };

class CharRefPToken {
   public readonly type: typeof CHARREF_PTOKEN = CHARREF_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly hexMarker?: SToken;
   public readonly hexMarkerSpace?: SToken;
   public readonly digits?: SToken;
   public readonly digitsSpace?: SToken;
   public readonly close?: SToken;
   public readonly charCode?: number;

   constructor(basePToken: CharRefPToken | PreToken) {
      Object.assign(this, basePToken);

      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData) {
      return checkWellFormed(this, ec, entityMetaData);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

class CharRefXToken {
   public readonly type: typeof CHARREF_XTOKEN = CHARREF_XTOKEN;
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

function parseCharRef(source: STokenSource, openSToken: SToken, deliverPToken: DeliverPToken): void {
   const pToken: PreToken = { open: openSToken };

   source.extractToObjectNoParams('space', pToken, 'openSpace');
   source.extract('multi', ['x', 'X'], (hexMarker) => {
      if (hexMarker) {
         pToken.hexMarker = hexMarker;
      }

      source.extractToObjectNoParams('space', pToken, 'hexMarkerSpace');
      source.extractToObject('digit', hexMarker ? 16 : 10, pToken, 'digits');
      source.extractToObjectNoParams('space', pToken, 'digitsSpace');

      source.extract('match', ';', (closeSToken) => {
         if (pToken.digits) {
            pToken.charCode = hexMarker ? parseInt(pToken.digits.str, 16) : parseInt(pToken.digits.str, 10);
         } else {
            pToken.charCode = 0;
         }
         pToken.close = closeSToken;

         deliverPToken(new CharRefPToken(pToken));
      });
   });
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: CharRefPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.CHARREF_XTRA_POST_OPEN_SPACE);

   ec.setPos(pToken.hexMarker);
   ec.check(pToken.hexMarker && pToken.hexMarker.str !== pToken.hexMarker.str.toLowerCase(),
      WFEID.CHARREF_INVALID_HEX_CASE);

   ec.setPos(pToken.hexMarkerSpace);
   ec.check(pToken.hexMarkerSpace, WFEID.CHARREF_XTRA_POST_HEX_SPACE);

   ec.setPos(pToken.digits);
   ec.check(!pToken.digits, WFEID.CHARREF_NO_DIGITS);

   ec.setPos(pToken.digitsSpace);
   ec.check(pToken.digitsSpace, WFEID.CHARREF_XTRA_POST_DIGITS_SPACE);

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
      pToken.openSpace,
      pToken.hexMarker,
      pToken.hexMarkerSpace,
      pToken.digits,
      pToken.digitsSpace,
      pToken.close);

      return builder.sTokenArray;
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

export {
   CHARREF_PTOKEN,
   CHARREF_XTOKEN,
   CharRefPToken,
   CharRefXToken,

   parseCharRef,
};
